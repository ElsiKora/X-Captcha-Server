import type { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export interface IChallengeDataPow {
	challenge: string;
	difficulty: number;
	type: ECaptchaType.POW;
}
