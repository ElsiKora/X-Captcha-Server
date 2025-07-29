import type { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export interface IChallengeSolutionClick {
	data: boolean;
	type: ECaptchaType.CLICK;
}
