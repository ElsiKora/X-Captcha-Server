import type { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export interface IChallengeSolutionPow {
	hash: string;
	nonce: string;
	type: ECaptchaType.POW;
}
