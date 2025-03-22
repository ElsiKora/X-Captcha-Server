import type { ICaptchaChallenge, IChallengeRepository } from "../../domain";

/**
 * In-memory implementation of the challenge repository
 * This is for development and testing purposes
 * In a production environment, this would be replaced with a database implementation
 */
export class InMemoryChallengeRepository implements IChallengeRepository {
	private readonly challenges = new Map<string, ICaptchaChallenge>();

	/**
	 * Get a challenge by ID
	 * @param id - The challenge ID
	 */
	async getChallenge(id: string): Promise<ICaptchaChallenge | null> {
		const challenge = this.challenges.get(id);

		return challenge ? { ...challenge } : null;
	}

	/**
	 * Remove a challenge from the repository
	 * @param id - The challenge ID
	 */
	async removeChallenge(id: string): Promise<void> {
		this.challenges.delete(id);
	}

	/**
	 * Save a challenge to the repository
	 * @param challenge - The challenge to save
	 */
	async saveChallenge(challenge: ICaptchaChallenge): Promise<void> {
		this.challenges.set(challenge.id, { ...challenge });
	}
}
