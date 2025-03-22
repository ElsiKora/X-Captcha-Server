import cors from "cors";
import express from "express";

import { CaptchaService } from "../application";

import { CaptchaController } from "./controller";
import { InMemoryChallengeRepository } from "./repository";

/**
 * Start the captcha server
 * @param port
 */
export function startServer(port = 3000): void {
	const app = express();
	app.use(express.json());
	app.use(cors());

	// Set up dependencies
	const challengeRepository = new InMemoryChallengeRepository();
	const captchaService = new CaptchaService(challengeRepository);
	const captchaController = new CaptchaController(captchaService);

	// Set up routes
	app.get("/api/captcha/challenge", (request, res) => captchaController.getChallenge(request, res));
	app.post("/api/captcha/validate", (request, res) => captchaController.validateChallenge(request, res));

	// Start the server
	app.listen(port, () => {
		console.log(`Captcha server running on port ${port}`);
	});
}
