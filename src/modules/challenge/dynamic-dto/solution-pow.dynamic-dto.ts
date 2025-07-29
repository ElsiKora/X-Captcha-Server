import type { TApiPropertyDescribeProperties } from "@elsikora/nestjs-crud-automator";

import { EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";
import { EApiPropertyDescribeType } from "@elsikora/nestjs-crud-automator";

import { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export const ChallengeSolutionPowDynamicDto: Record<string, TApiPropertyDescribeProperties> = {
	hash: {
		description: "solution PoW hash",
		exampleValue: "683d2b8b9b06b518de4b55e6f289e5fd",
		format: EApiPropertyStringType.LOWERCASE_STRING,
		maxLength: 32,
		minLength: 32,
		pattern: "/^[a-f0-9]{32}/",
		type: EApiPropertyDescribeType.STRING,
	},
	nonce: {
		description: "solution PoW nonce",
		exampleValue: "683d2b8b9b06b518de4b55e6f289e5fd",
		format: EApiPropertyStringType.LOWERCASE_STRING,
		maxLength: 32,
		minLength: 32,
		pattern: "/^[a-f0-9]{32}/",
		type: EApiPropertyDescribeType.STRING,
	},
	type: {
		description: "data type",
		enum: ECaptchaType,
		enumName: "ECaptchaType",
		type: EApiPropertyDescribeType.ENUM,
	},
};
