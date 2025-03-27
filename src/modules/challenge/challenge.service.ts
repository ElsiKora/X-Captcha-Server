import * as crypto from "node:crypto";

import { ApiService, ApiServiceBase, EErrorStringAction, EErrorStringCompositeAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EntityManager } from "typeorm/entity-manager/EntityManager";

import { ECaptchaType } from "../../shared/enum/captcha-type.enum";

import { Challenge } from "./entity/challenge.entity";
import { IChallengeDataPow } from "./interface/data-pow.interface";
import { IChallengeSolutionPow } from "./interface/solution-pow.interface";
import { IChallengeSolveProperties } from "./interface/solve-properties.interface";
import { IChallengeSolveResult } from "./interface/solve-result.interface";
import { IChallengeVerifyProperties } from "./interface/verify-properties.interface";
import { IChallengeVerifyResult } from "./interface/verify-result.interface";

@ApiService({ entity: Challenge })
@Injectable()
export default class ChallengeService extends ApiServiceBase<Challenge> {
	constructor(
		@InjectRepository(Challenge)
		private readonly repository: Repository<Challenge>,
	) {
		super();
	}

	setUpChallenge(challenge: Challenge, eventManager: EntityManager): Promise<Challenge> {
		switch (challenge.type) {
			case ECaptchaType.CLICK: {
				return this.update(
					{ id: challenge.id },
					{
						data: {
							// eslint-disable-next-line @elsikora/typescript/naming-convention
							challenge: true,
							type: ECaptchaType.CLICK,
						},
					},
					eventManager,
				);
			}

			case ECaptchaType.POW: {
				return this.update(
					{ id: challenge.id },
					{
						data: {
							// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
							challenge: crypto.randomBytes(16).toString("hex"),
							// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
							difficulty: 5,
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
		const { challenge, solution }: IChallengeSolveProperties = properties;

		if (challenge.isSolved) {
			throw new ConflictException(ErrorString({ entity: Challenge, type: EErrorStringAction.ALREADY_PROCESSED }));
		}

		if (solution.type !== challenge.type) {
			throw new BadRequestException(ErrorString({ entity: Challenge, property: "SOLUTION", type: EErrorStringCompositeAction.INVALID_FORMAT }));
		}

		// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
		if (+new Date(challenge.createdAt) + 60_000 > Date.now()) {
			throw new BadRequestException(ErrorString({ entity: Challenge, type: EErrorStringAction.EXPIRED }));
		}

		if (challenge.type === ECaptchaType.POW && solution.type === ECaptchaType.POW && challenge.data.type === ECaptchaType.POW) {
			const { hash, nonce }: IChallengeSolutionPow = solution;
			const { challenge: powChallenge, difficulty }: IChallengeDataPow = challenge.data;

			const calculatedHash: string = this.calculateHash(powChallenge, Number.parseInt(nonce));
			const isValid: boolean = this.isValidHash(calculatedHash, difficulty);

			if (!isValid || calculatedHash !== hash) {
				throw new BadRequestException(ErrorString({ entity: Challenge, property: "SOLUTION", type: EErrorStringCompositeAction.INVALID }));
			}
		}

		await this.update({ id: challenge.id }, { isSolved: true, solution });

		return { token: challenge.token };
	}

	verify(properties: IChallengeVerifyProperties): IChallengeVerifyResult {
		const { challenge }: IChallengeVerifyProperties = properties;

		return { isSolved: challenge.isSolved };
	}

	private calculateHash(challenge: string, nonce: number): string {
		return crypto
			.createHash("sha256")
			.update(`${challenge}${String(nonce)}`)
			.digest("hex");
	}

	private isValidHash(hash: string, difficulty: number): boolean {
		const prefix: string = "0".repeat(difficulty);

		return hash.startsWith(prefix);
	}
}
