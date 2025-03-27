import { ApiPropertyCopy, EApiDtoType, EApiRouteType } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";
import { IChallengeSolutionClick } from "../interface/solution-click.interface";
import { IChallengeSolutionPow } from "../interface/solution-pow.interface";

export class ChallengeSolveRequestBodyDTO {
	@ApiPropertyCopy(Challenge, "solution", EApiRouteType.UPDATE, EApiDtoType.BODY)
	solution!: IChallengeSolutionClick | IChallengeSolutionPow;
}
