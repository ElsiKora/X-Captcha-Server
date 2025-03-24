/* eslint-disable @elsikora/typescript/no-magic-numbers */
import { ApiPropertyString, EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";

import { Challenge } from "../entity/challenge.entity";

export class ChallengeSolveRequestBodyDTO {
	@ApiPropertyString({
		description: "solution",
		entity: Challenge,
		exampleValue: "123",
		format: EApiPropertyStringType.STRING,
		isRequired: true,
		maxLength: 256,
		minLength: 3,
		pattern: "/^[a-zA-Z0-9]{3,256}$/",
	})
	solution!: string;
}
