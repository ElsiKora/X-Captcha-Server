import type { ICaptchaChallenge } from "./captcha.interface";

/**
 * Interface for challenge repository
 */
export interface IChallengeRepository {
	/**
	 * Get a challenge by ID
	 * @param id - The challenge ID
	 */
	getChallenge(id: string): Promise<ICaptchaChallenge | null>;

	/**
	 * Remove a challenge from the repository
	 * @param id - The challenge ID
	 */
	removeChallenge(id: string): Promise<void>;

	/**
	 * Save a challenge to the repository
	 * @param challenge - The challenge to save
	 */
	saveChallenge(challenge: ICaptchaChallenge): Promise<void>;
}
