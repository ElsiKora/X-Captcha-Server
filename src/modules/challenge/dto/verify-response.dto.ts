import { ApiPropertyBoolean } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeVerifyResponseDTO {
	@ApiPropertyBoolean({
		description: "solved status",
		entity: Challenge,
		isExpose: true,
		isResponse: true,
	})
	isSolved!: boolean;
}
