import type { TApiPropertyDescribeProperties } from "@elsikora/nestjs-crud-automator";

import { EApiDtoType, EApiRouteType } from "@elsikora/nestjs-crud-automator";
import { EApiPropertyDescribeType } from "@elsikora/nestjs-crud-automator";

import { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export const ChallengeSolutionClickDynamicDto: Record<string, TApiPropertyDescribeProperties> = {
	data: {
		description: "solution click data",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.RESPONSE]: {
					isEnabled: false,
					isExpose: false,
					isResponse: true,
				},
			},
		},
		type: EApiPropertyDescribeType.BOOLEAN,
	},
	type: {
		description: "data type",
		enum: ECaptchaType,
		enumName: "ECaptchaType",
		type: EApiPropertyDescribeType.ENUM,
	},
};
