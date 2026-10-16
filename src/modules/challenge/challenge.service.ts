import type { IConfigData } from "@elsikora/nestjs-crud-config";

import * as crypto from "node:crypto";

import { ApiService, ApiServiceBase, ApiServiceObservable, EErrorStringAction, EErrorStringCompositeAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { CrudConfigService } from "@elsikora/nestjs-crud-config";
import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, UpdateResult } from "typeorm";
import { EntityManager } from "typeorm/entity-manager/EntityManager";

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

@ApiService({ entity: Challenge })
@ApiServiceObservable()
@Injectable()
export class ChallengeService extends ApiServiceBase<Challenge> {
	constructor(
		@InjectRepository(Challenge)
		private readonly repository: Repository<Challenge>,
		private readonly crudConfigService: CrudConfigService,
	) {
		super();
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
				const powCaptchaDifficulty: IConfigData = await this.crudConfigService.get({ name: "powCaptchaDifficulty", section: "challenge" });

				return this.update(
					{ id: challenge.id },
					{
						data: {
							challenge: crypto.randomBytes(16).toString("hex"),
							difficulty: Number.parseInt(powCaptchaDifficulty.value),
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

		const captchaTtlMs: IConfigData = await this.crudConfigService.get({ name: "captchaTtlMs", section: "challenge" });

		if (+new Date(challenge.createdAt) + Number.parseInt(captchaTtlMs.value) < Date.now()) {
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

		return { isSolved: challenge.isSolved };
	}

	private calculateHash(challenge: string, nonce: number): string {
		return crypto
			.createHash("sha256")
			.update(`${challenge}${String(nonce)}`)
			.digest("hex");
	}

	private isValidPowSolution(data: IChallengeDataPow, solution: IChallengeSolutionPow): boolean {
		if (typeof data.challenge !== "string" || data.challenge.length === 0 || !Number.isInteger(data.difficulty) || data.difficulty < 1) {
			return false;
		}

		const calculatedHash: string = this.calculateHash(data.challenge, Number.parseInt(solution.nonce, 10));

		return calculatedHash === solution.hash && calculatedHash.startsWith("0".repeat(data.difficulty));
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
