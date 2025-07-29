import type { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export interface IChallengeDataClick {
	challenge: boolean;
	type: ECaptchaType.CLICK;
}
