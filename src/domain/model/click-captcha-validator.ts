import type { ICaptchaValidationResult } from "../interface/captcha.interface";

/**
 * Validator for click captcha
 */
export class ClickCaptchaValidator {
	/**
	 * Validate a click captcha response
	 * @param response - The response to validate
	 * @returns Validation result
	 */
	static validate(response: unknown): ICaptchaValidationResult {
		// For a one-click captcha, we simply check if the user clicked
		// This is a very basic implementation that could be enhanced
		// with more sophisticated validation in a real-world scenario
		if (response === true) {
			return {
				isSuccess: true,
				token: this.generateToken(),
			};
		}

		return {
			error: "Invalid captcha response",
			isSuccess: false,
		};
	}

	/**
	 * Generate a validation token
	 * @returns Generated token
	 */
	private static generateToken(): string {
		// Simple token generation for demonstration
		// In a real implementation, this would be more secure
		return `xcaptcha_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	}
}
