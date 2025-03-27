import { ApiPropertyUUID } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeVerifyRequestBodyDTO {
	@ApiPropertyUUID({ description: "solution token", entity: Challenge, isRequired: true })
	token!: string;
}
