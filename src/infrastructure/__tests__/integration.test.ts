import request from "supertest";
import express from "express";
import cors from "cors";
import { CaptchaService } from "../../application";
import { CaptchaController } from "../controller";
import { InMemoryChallengeRepository } from "../repository";

describe("Captcha API Integration Tests", () => {
	let app: express.Express;
	let challengeId: string;
	
	beforeAll(() => {
		// Set up the express app with the necessary dependencies
		app = express();
		app.use(express.json());
		app.use(cors());
		
		// Set up the captcha service
		const repository = new InMemoryChallengeRepository();
		const captchaService = new CaptchaService(repository);
		const captchaController = new CaptchaController(captchaService);
		
		// Set up routes
		app.get("/api/captcha/challenge", (req, res) => captchaController.getChallenge(req, res));
		app.post("/api/captcha/validate", (req, res) => captchaController.validateChallenge(req, res));
	});
	
	it("should return a challenge when requested", async () => {
		// Act
		const response = await request(app).get("/api/captcha/challenge");
		
		// Assert
		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			id: expect.any(String),
			type: "click",
			createdAt: expect.any(String),
			expiresAt: expect.any(String)
		});
		
		// Store the challenge ID for later tests
		challengeId = response.body.id;
	});
	
	it("should validate a captcha challenge successfully", async () => {
		// Arrange - ensure we have a valid challenge ID
		expect(challengeId).toBeDefined();
		
		// Act
		const response = await request(app)
			.post("/api/captcha/validate")
			.send({
				challengeId,
				response: true
			});
		
		// Assert
		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			success: true,
			token: expect.any(String)
		});
	});
	
	it("should return an error for invalid challenge ID", async () => {
		// Act
		const response = await request(app)
			.post("/api/captcha/validate")
			.send({
				challengeId: "invalid-id",
				response: true
			});
		
		// Assert
		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			success: false,
			error: "Challenge not found"
		});
	});
	
	it("should return an error for invalid validation request format", async () => {
		// Act
		const response = await request(app)
			.post("/api/captcha/validate")
			.send({});
		
		// Assert
		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({
			error: expect.any(String)
		});
	});
});