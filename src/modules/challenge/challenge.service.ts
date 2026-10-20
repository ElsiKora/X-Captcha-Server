import type { IConfigData } from "@elsikora/nestjs-crud-config";

import * as crypto from "node:crypto";

import { ApiService, ApiServiceBase, ApiServiceObservable, EErrorStringAction, EErrorStringCompositeAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { CrudConfigService } from "@elsikora/nestjs-crud-config";
import { BadRequestException, ConflictException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";
import { EntityManager } from "typeorm/entity-manager/EntityManager";

import CONFIG_CONSTANT from "../../shared/constant/config.constant";
import NUMBER_CONSTANT from "../../shared/constant/number.constant";
import { ECaptchaType } from "../../shared/enum/captcha-type.enum";

import { Challenge } from "./entity/challenge.entity";
import { IChallengeDataPow } from "./interface/data-pow.interface";
import { IChallengeSolutionClick } from "./interface/solution-click.interface";
import { IChallengeSolutionPow } from "./interface/solution-pow.interface";
import { IChallengeSolveProperties } from "./interface/solve-properties.interface";
import { IChallengeSolveResult } from "./interface/solve-result.interface";
import { IChallengeVerifyProperties } from "./interface/verify-properties.interface";
import { IChallengeVerifyResult } from "./interface/verify-result.interface";

const POW_HASH_PATTERN: RegExp = /^[0-9a-f]{64}$/;
const POW_NONCE_PATTERN: RegExp = /^(?:0|[1-9]\d{0,14})$/;

const CHALLENGE_CONFIG_NAMES: ReadonlyArray<string> = ["captchaTtlMs", "powCaptchaDifficulty"];

interface IConfigCacheEntry {
	expiresAt: number;
	value: string;
}

@ApiService({ entity: Challenge })
@ApiServiceObservable()
@Injectable()
export class ChallengeService extends ApiServiceBase<Challenge> implements OnApplicationBootstrap {
	private readonly CONFIG_CACHE: Map<string, IConfigCacheEntry> = new Map<string, IConfigCacheEntry>();

	private readonly CONFIG_LOADS: Map<string, Promise<string>> = new Map<string, Promise<string>>();

	private readonly LOGGER: Logger = new Logger(ChallengeService.name);

	constructor(
		@InjectRepository(Challenge)
		private readonly repository: Repository<Challenge>,
		private readonly crudConfigService: CrudConfigService,
	) {
		super();
	}

	/**
	 * Loads the challenge config before the worker starts listening, so requests do not hit a cold cache.
	 */
	async onApplicationBootstrap(): Promise<void> {
		await Promise.all(
			CHALLENGE_CONFIG_NAMES.map((name: string) =>
				this.getChallengeConfigValue(name).catch((error: unknown) => {
					this.LOGGER.warn(`Could not preload challenge config "${name}", it will be read on first use: ${error instanceof Error ? error.message : String(error)}`);
				}),
			),
		);
	}

	async setUpChallenge(challenge: Challenge, eventManager: EntityManager): Promise<Challenge> {
		switch (challenge.type) {
			case ECaptchaType.CLICK: {
				return this.update(
					{ id: challenge.id },
					{
						data: {
							challenge: true,
							type: ECaptchaType.CLICK,
						},
					},
					eventManager,
				);
			}

			case ECaptchaType.POW: {
				// Runs inside the insert transaction: a cache miss must read through its connection, not wait for a second one from the pool.
				const powCaptchaDifficulty: string = await this.getChallengeConfigValue("powCaptchaDifficulty", eventManager);

				return this.update(
					{ id: challenge.id },
					{
						data: {
							challenge: crypto.randomBytes(16).toString("hex"),
							difficulty: Number.parseInt(powCaptchaDifficulty),
							type: ECaptchaType.POW,
						},
					},
					eventManager,
				);
			}

			default: {
				throw new BadRequestException(ErrorString({ entity: Challenge, type: EErrorStringAction.INVALID_TYPE }));
			}
		}
	}

	async solve(properties: IChallengeSolveProperties): Promise<IChallengeSolveResult> {
		const { challenge }: IChallengeSolveProperties = properties;

		if (challenge.isSolved) {
			throw new ConflictException(ErrorString({ entity: Challenge, type: EErrorStringAction.ALREADY_PROCESSED }));
		}

		const solution: IChallengeSolutionClick | IChallengeSolutionPow = this.normalizeSolution(properties.solution);

		if (solution.type !== challenge.type) {
			throw new BadRequestException(ErrorString({ entity: Challenge, property: "SOLUTION", type: EErrorStringCompositeAction.INVALID_FORMAT }));
		}

		const captchaTtlMs: string = await this.getChallengeConfigValue("captchaTtlMs");

		if (+new Date(challenge.createdAt) + Number.parseInt(captchaTtlMs) < Date.now()) {
			throw new BadRequestException(ErrorString({ entity: Challenge, type: EErrorStringAction.EXPIRED }));
		}

		if (challenge.type === ECaptchaType.POW && (solution.type !== ECaptchaType.POW || challenge.data.type !== ECaptchaType.POW || !this.isValidPowSolution(challenge.data, solution))) {
			throw new BadRequestException(ErrorString({ entity: Challenge, property: "SOLUTION", type: EErrorStringCompositeAction.INVALID }));
		}

		const result: UpdateResult = await this.repository.update({ id: challenge.id, isSolved: false }, { isSolved: true, solution });

		if (result.affected !== 1) {
			throw new ConflictException(ErrorString({ entity: Challenge, type: EErrorStringAction.ALREADY_PROCESSED }));
		}

		return { token: challenge.token };
	}

	async verify(properties: IChallengeVerifyProperties): Promise<IChallengeVerifyResult> {
		const { challenge }: IChallengeVerifyProperties = properties;

		if (challenge.isVerified) {
			throw new ConflictException(ErrorString({ entity: Challenge, type: EErrorStringAction.ALREADY_PROCESSED }));
		}

		const result: UpdateResult = await this.repository.update({ id: challenge.id, isVerified: false }, { isVerified: true });

		if (result.affected !== 1) {
			throw new ConflictException(ErrorString({ entity: Challenge, type: EErrorStringAction.ALREADY_PROCESSED }));
		}

		// The token is burned either way; an expired solution is reported exactly like an unsolved one.
		return { isSolved: challenge.isSolved && !this.isSolutionExpired(challenge) };
	}

	private calculateHash(challenge: string, nonce: number): string {
		return crypto
			.createHash("sha256")
			.update(`${challenge}${String(nonce)}`)
			.digest("hex");
	}

	/**
	 * Reads a value of the "challenge" config section through a per-process cache.
	 *
	 * Values are stored encrypted, and every uncached read costs two queries plus a synchronous scrypt key derivation
	 * (tens of ms of blocked event loop). Once a value is cached, requests never wait for the database again:
	 * after CHALLENGE_CONFIG_CACHE_SECONDS the stale value is still returned while one background read refreshes it,
	 * and a failed refresh keeps the stale value.
	 * @param {string} name Config name in the "challenge" section
	 * @param {EntityManager} [eventManager] Transaction to read through on a cache miss
	 * @returns {Promise<string>} The decrypted value
	 */
	private async getChallengeConfigValue(name: string, eventManager?: EntityManager): Promise<string> {
		const cached: IConfigCacheEntry | undefined = this.CONFIG_CACHE.get(name);

		if (!cached) {
			return this.loadChallengeConfigValue(name, eventManager);
		}

		if (cached.expiresAt <= Date.now() && !this.CONFIG_LOADS.has(name)) {
			this.loadChallengeConfigValue(name).catch((error: unknown) => {
				this.LOGGER.warn(`Could not refresh challenge config "${name}", keeping the cached value: ${error instanceof Error ? error.message : String(error)}`);
			});
		}

		return cached.value;
	}

	/**
	 * Whether a solved challenge is too old to be verified.
	 * `updatedAt` is the solve time: the conditional UPDATE in solve() is the last write before verify (TypeORM sets `updatedAt` on every update).
	 * @param {Challenge} challenge The challenge as loaded before verify updates it
	 * @returns {boolean} True when the solution is older than the TTL or its time is unknown
	 */
	private isSolutionExpired(challenge: Challenge): boolean {
		const solvedAt: number = new Date(challenge.updatedAt).getTime();

		if (!Number.isFinite(solvedAt)) {
			return true;
		}

		return Date.now() - solvedAt > CONFIG_CONSTANT.CHALLENGE_SOLUTION_TTL_SECONDS * NUMBER_CONSTANT.MILLISECONDS_IN_SECOND;
	}

	private isValidPowSolution(data: IChallengeDataPow, solution: IChallengeSolutionPow): boolean {
		if (typeof data.challenge !== "string" || data.challenge.length === 0 || !Number.isInteger(data.difficulty) || data.difficulty < 1) {
			return false;
		}

		const calculatedHash: string = this.calculateHash(data.challenge, Number.parseInt(solution.nonce, 10));

		return calculatedHash === solution.hash && calculatedHash.startsWith("0".repeat(data.difficulty));
	}

	private loadChallengeConfigValue(name: string, eventManager?: EntityManager): Promise<string> {
		const inFlight: Promise<string> | undefined = this.CONFIG_LOADS.get(name);

		if (inFlight) {
			return inFlight;
		}

		const load: Promise<string> = this.crudConfigService
			.get({ eventManager, name, section: "challenge" })
			.then((data: IConfigData) => {
				this.CONFIG_CACHE.set(name, { expiresAt: Date.now() + CONFIG_CONSTANT.CHALLENGE_CONFIG_CACHE_SECONDS * NUMBER_CONSTANT.MILLISECONDS_IN_SECOND, value: data.value });

				return data.value;
			})
			.finally(() => {
				this.CONFIG_LOADS.delete(name);
			});

		this.CONFIG_LOADS.set(name, load);

		return load;
	}

	private normalizeSolution(solution: unknown): IChallengeSolutionClick | IChallengeSolutionPow {
		const invalid: BadRequestException = new BadRequestException(ErrorString({ entity: Challenge, property: "SOLUTION", type: EErrorStringCompositeAction.INVALID_FORMAT }));

		if (typeof solution !== "object" || solution === null || Array.isArray(solution)) {
			throw invalid;
		}

		const { data, hash, nonce, type }: Record<string, unknown> = solution as Record<string, unknown>;

		if (type === ECaptchaType.POW) {
			if (typeof hash !== "string" || !POW_HASH_PATTERN.test(hash) || typeof nonce !== "string" || !POW_NONCE_PATTERN.test(nonce)) {
				throw invalid;
			}

			return { hash, nonce, type: ECaptchaType.POW };
		}

		if (type === ECaptchaType.CLICK) {
			if (data !== true) {
				throw invalid;
			}

			return { data, type: ECaptchaType.CLICK };
		}

		throw invalid;
	}
}
