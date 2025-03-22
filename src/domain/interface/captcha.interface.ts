/**
 * Interface representing captcha challenge data
 */
export interface ICaptchaChallenge {
	createdAt: Date;
	expiresAt: Date;
	id: string;
	type: string;
}

/**
 * Interface representing captcha validation request
 */
export interface ICaptchaValidationRequest {
	challengeId: string;
	response: any;
}

/**
 * Interface representing captcha validation result
 */
export interface ICaptchaValidationResult {
	error?: string;
	isSuccess: boolean;
	token?: string;
}
