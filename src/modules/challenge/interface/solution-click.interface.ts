import type { ECaptchaType } from "../../../shared/enum/captcha-type.enum";

export interface IChallengeSolutionClick {
	// eslint-disable-next-line @elsikora/typescript/naming-convention
	data: boolean;
	type: ECaptchaType.CLICK;
}
