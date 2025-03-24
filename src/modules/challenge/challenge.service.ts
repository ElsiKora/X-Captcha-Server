import { ApiService, ApiServiceBase, EErrorStringAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Challenge } from "./entity/challenge.entity";
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

	async solve(properties: IChallengeSolveProperties): Promise<IChallengeSolveResult> {
		const { challenge, solution }: IChallengeSolveProperties = properties;

		if (challenge.isSolved) {
			throw new ConflictException(ErrorString({ entity: Challenge, type: EErrorStringAction.ALREADY_PROCESSED }));
		}

		await this.update({ id: challenge.id }, { isSolved: true, solution });

		return { token: challenge.token };
	}

	verify(properties: IChallengeVerifyProperties): IChallengeVerifyResult {
		const { challenge }: IChallengeVerifyProperties = properties;

		return { isSolved: challenge.isSolved };
	}
}
