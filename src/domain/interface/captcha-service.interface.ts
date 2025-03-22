import type { ICaptchaChallenge, ICaptchaValidationRequest, ICaptchaValidationResult } from "./captcha.interface";

/**
 * Interface for captcha service
 */
export interface ICaptchaService {
	/**
	 * Generate a new captcha challenge
	 */
	generateChallenge(): Promise<ICaptchaChallenge>;

	/**
	 * Validate captcha response
	 * @param validationRequest - The validation request
	 */
	validateCaptcha(validationRequest: ICaptchaValidationRequest): Promise<ICaptchaValidationResult>;
}
