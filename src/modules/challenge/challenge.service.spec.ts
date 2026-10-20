import type { CrudConfigService } from "@elsikora/nestjs-crud-config";
import type { Repository, UpdateResult } from "typeorm";

import type { Challenge } from "./entity/challenge.entity";

import { ConflictException } from "@nestjs/common";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ECaptchaType } from "../../shared/enum/captcha-type.enum";

import { ChallengeService } from "./challenge.service";

const SECOND_MS: number = 1000;

interface IUpdateCall {
	criteria: unknown;
	values: unknown;
}

function createService(affected: number = 1): { calls: Array<IUpdateCall>; service: ChallengeService } {
	const calls: Array<IUpdateCall> = [];

	const repository: Partial<Repository<Challenge>> = {
		update: (criteria: unknown, values: unknown): Promise<UpdateResult> => {
			calls.push({ criteria, values });

			return Promise.resolve({ affected, generatedMaps: [], raw: [] });
		},
	};

	return { calls, service: new ChallengeService(repository as Repository<Challenge>, {} as CrudConfigService) };
}

function createChallenge(overrides: Partial<Challenge>): Challenge {
	return {
		createdAt: new Date(),
		data: { challenge: "abc", difficulty: 1, type: ECaptchaType.POW },
		id: "00000000-0000-4000-8000-000000000001",
		isSolved: true,
		isVerified: false,
		solution: { hash: "0".repeat(64), nonce: "1", type: ECaptchaType.POW },
		token: "00000000-0000-4000-8000-000000000002",
		type: ECaptchaType.POW,
		updatedAt: new Date(),
		...overrides,
	} as Challenge;
}

void describe("ChallengeService.verify solution TTL (default 120 s)", () => {
	void it("accepts a token solved a few seconds ago and burns it", async () => {
		const { calls, service } = createService();

		const result = await service.verify({ challenge: createChallenge({ updatedAt: new Date(Date.now() - 5 * SECOND_MS) }) });

		assert.deepEqual(result, { isSolved: true });
		assert.deepEqual(calls, [{ criteria: { id: "00000000-0000-4000-8000-000000000001", isVerified: false }, values: { isVerified: true } }]);
	});

	void it("accepts a token solved just under the TTL", async () => {
		const { service } = createService();

		const result = await service.verify({ challenge: createChallenge({ updatedAt: new Date(Date.now() - 119 * SECOND_MS) }) });

		assert.deepEqual(result, { isSolved: true });
	});

	void it("reports a token solved more than TTL ago as unsolved, and still burns it", async () => {
		const { calls, service } = createService();

		const result = await service.verify({ challenge: createChallenge({ createdAt: new Date(Date.now() - 200 * SECOND_MS), updatedAt: new Date(Date.now() - 121 * SECOND_MS) }) });

		assert.deepEqual(result, { isSolved: false });
		assert.equal(calls.length, 1);
	});

	void it("counts the TTL from the solve time, not from creation", async () => {
		const { service } = createService();

		const result = await service.verify({ challenge: createChallenge({ createdAt: new Date(Date.now() - 300 * SECOND_MS), updatedAt: new Date(Date.now() - 10 * SECOND_MS) }) });

		assert.deepEqual(result, { isSolved: true });
	});

	void it("fails closed when the solve time is unknown", async () => {
		const { service } = createService();

		const result = await service.verify({ challenge: createChallenge({ updatedAt: new Date(Number.NaN) }) });

		assert.deepEqual(result, { isSolved: false });
	});

	void it("reports an unsolved challenge as unsolved", async () => {
		const { service } = createService();

		const result = await service.verify({ challenge: createChallenge({ isSolved: false }) });

		assert.deepEqual(result, { isSolved: false });
	});

	void it("rejects a token that was already verified", async () => {
		const { calls, service } = createService();

		await assert.rejects(service.verify({ challenge: createChallenge({ isVerified: true }) }), ConflictException);
		assert.equal(calls.length, 0);
	});

	void it("rejects a token burned concurrently by another request", async () => {
		const { service } = createService(0);

		await assert.rejects(service.verify({ challenge: createChallenge({}) }), ConflictException);
	});
});
