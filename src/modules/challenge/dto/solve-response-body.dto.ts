import { ApiPropertyUUID } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeSolveResponseBodyDTO {
	@ApiPropertyUUID({ entity: Challenge, isExpose: true, isResponse: true })
	token!: string;
}
