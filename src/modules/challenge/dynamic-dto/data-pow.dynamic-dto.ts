import type { TApiPropertyDescribeProperties } from "@elsikora/nestjs-crud-automator";

import { EApiPropertyDescribeType, EApiPropertyNumberType, EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";

import { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export const ChallengeDataPowDynamicDto: Record<string, TApiPropertyDescribeProperties> = {
	challenge: {
		description: "data PoW challenge",
		exampleValue: "683d2b8b9b06b518de4b55e6f289e5fd",
		format: EApiPropertyStringType.LOWERCASE_STRING,
		maxLength: 32,
		minLength: 32,
		pattern: "/^[a-f0-9]{32}/",
		type: EApiPropertyDescribeType.STRING,
	},
	difficulty: {
		description: "data difficulty",
		exampleValue: 1,
		format: EApiPropertyNumberType.INTEGER,
		maximum: 32,
		minimum: 0,
		multipleOf: 1,
		type: EApiPropertyDescribeType.NUMBER,
	},
	type: {
		description: "data type",
		enum: ECaptchaType,
		enumName: "ECaptchaType",
		type: EApiPropertyDescribeType.ENUM,
	},
};
