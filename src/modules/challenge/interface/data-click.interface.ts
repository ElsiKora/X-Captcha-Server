import type { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export interface IChallengeDataClick {
	// eslint-disable-next-line @elsikora/typescript/naming-convention
	challenge: boolean;
	type: ECaptchaType.CLICK;
}
