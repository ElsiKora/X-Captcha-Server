import { ApiPropertyUUID } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeSolveRequestParametersDTO {
	@ApiPropertyUUID({ entity: Challenge, isRequired: true })
	challenge!: string;
}
