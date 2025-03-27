import type { TApiPropertyDescribeProperties } from "@elsikora/nestjs-crud-automator";

import { EApiPropertyDescribeType } from "@elsikora/nestjs-crud-automator";

import { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

// @ts-ignore
export const ChallengeDataClickDynamicDto: Record<string, TApiPropertyDescribeProperties> = {
	challenge: {
		description: "data click challenge",
		type: EApiPropertyDescribeType.BOOLEAN,
	},
	type: {
		description: "data type",
		enum: ECaptchaType,
		enumName: "ECaptchaType",
		type: EApiPropertyDescribeType.ENUM,
	},
};
