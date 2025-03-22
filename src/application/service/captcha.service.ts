import { v4 as uuidv4 } from "uuid";

import { ClickCaptchaValidator, ECaptchaType, type ICaptchaChallenge, type ICaptchaService, type ICaptchaValidationRequest, type ICaptchaValidationResult, type IChallengeRepository } from "../../domain";

/**
 * Implementation of the captcha service
 */
export class CaptchaService implements ICaptchaService {
	constructor(private readonly challengeRepository: IChallengeRepository) {}

	/**
	 * Generate a new captcha challenge
	 */
	async generateChallenge(): Promise<ICaptchaChallenge> {
		// For now, we only support click captcha
		const challenge: ICaptchaChallenge = {
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 30 * 1000), // 30 seconds expiration
			id: uuidv4(),
			type: ECaptchaType.CLICK,
		};

		await this.challengeRepository.saveChallenge(challenge);

		return challenge;
	}

	/**
	 * Validate captcha response
	 * @param validationRequest - The validation request
	 */
	async validateCaptcha(validationRequest: ICaptchaValidationRequest): Promise<ICaptchaValidationResult> {
		const challenge = await this.challengeRepository.getChallenge(validationRequest.challengeId);

		if (!challenge) {
			return {
				error: "Challenge not found",
				isSuccess: false,
			};
		}

		// Check if challenge has expired
		if (challenge.expiresAt < new Date()) {
			return {
				error: "Challenge has expired",
				isSuccess: false,
			};
		}

		// Validate based on challenge type
		let result: ICaptchaValidationResult;

		switch (challenge.type) {
			case ECaptchaType.CLICK: {
				result = ClickCaptchaValidator.validate(validationRequest.response);

				break;
			}

			default: {
				result = {
					error: `Unsupported challenge type: ${challenge.type}`,
					isSuccess: false,
				};
			}
		}

		// Remove the challenge if validation was successful
		if (result.isSuccess) {
			await this.challengeRepository.removeChallenge(challenge.id);
		}

		return result;
	}
}
