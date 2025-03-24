import { ApiPropertyBoolean } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeVerifyResponseBodyDTO {
	@ApiPropertyBoolean({
		description: "solved status",
		entity: Challenge,
		isExpose: true,
		isResponse: true,
	})
	isSolved!: boolean;
}
