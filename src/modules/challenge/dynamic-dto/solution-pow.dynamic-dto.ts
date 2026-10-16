import type { TApiPropertyDescribeProperties } from "@elsikora/nestjs-crud-automator";

import { EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";
import { EApiPropertyDescribeType } from "@elsikora/nestjs-crud-automator";

import { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export const ChallengeSolutionPowDynamicDto: Record<string, TApiPropertyDescribeProperties> = {
	hash: {
		description: "solution PoW hash (SHA-256 hex)",
		exampleValue: "00006d90527ddc15aab2d83960c170afbfd6526e0533b8b7446a0166ec7b11c7",
		format: EApiPropertyStringType.LOWERCASE_STRING,
		maxLength: 64,
		minLength: 64,
		pattern: "/^[a-f0-9]{64}$/",
		type: EApiPropertyDescribeType.STRING,
	},
	nonce: {
		description: "solution PoW nonce (decimal integer)",
		exampleValue: "81688",
		format: EApiPropertyStringType.STRING,
		maxLength: 15,
		minLength: 1,
		pattern: "/^(0|[1-9][0-9]{0,14})$/",
		type: EApiPropertyDescribeType.STRING,
	},
	type: {
		description: "data type",
		enum: ECaptchaType,
		enumName: "ECaptchaType",
		type: EApiPropertyDescribeType.ENUM,
	},
};
