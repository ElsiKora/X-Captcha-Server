import type { Request, Response } from "express";

import type { ICaptchaService } from "../../domain";

/**
 * Controller for captcha API endpoints
 */
export class CaptchaController {
	constructor(private readonly captchaService: ICaptchaService) {}

	/**
	 * Handle challenge generation request
	 * @param req
	 * @param request
	 * @param res
	 */
	async getChallenge(request: Request, res: Response): Promise<void> {
		try {
			const challenge = await this.captchaService.generateChallenge();
			res.status(200).json(challenge);
		} catch (error) {
			console.error("Error generating challenge:", error);
			res.status(500).json({ error: "Failed to generate challenge" });
		}
	}

	/**
	 * Handle challenge validation request
	 * @param req
	 * @param request
	 * @param res
	 */
	async validateChallenge(request: Request, res: Response): Promise<void> {
		try {
			const { challengeId, response } = request.body;

			if (!challengeId || response === undefined) {
				res.status(400).json({ error: "Invalid request. challengeId and response are required." });

				return;
			}

			const result = await this.captchaService.validateCaptcha({
				challengeId,
				response,
			});

			res.status(200).json(result);
		} catch (error) {
			console.error("Error validating challenge:", error);
			res.status(500).json({ error: "Failed to validate challenge" });
		}
	}
}
