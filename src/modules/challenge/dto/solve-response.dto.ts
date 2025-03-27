import { ApiPropertyUUID } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeSolveResponseDTO {
	@ApiPropertyUUID({ description: "solution token", entity: Challenge, isExpose: true, isResponse: true })
	token!: string;
}
