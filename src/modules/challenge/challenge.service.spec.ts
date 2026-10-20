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

void describe("ChallengeService challenge config cache", () => {
	interface IGetCall {
		eventManager: unknown;
		name: string;
	}

	function createConfigService(values: Array<Error | string>): { calls: Array<IGetCall>; configService: CrudConfigService } {
		const calls: Array<IGetCall> = [];

		const configService: Partial<CrudConfigService> = {
			get: (options: { eventManager?: unknown; name: string }) => {
				calls.push({ eventManager: options.eventManager, name: options.name });
				const next: Error | string | undefined = values.shift();

				return next instanceof Error ? Promise.reject(next) : Promise.resolve({ value: next ?? "" } as never);
			},
		};

		return { calls, configService: configService as CrudConfigService };
	}

	const flush = (): Promise<void> => new Promise((resolve: () => void) => setImmediate(resolve));

	void it("reads each value once and reuses it, sharing concurrent reads", async () => {
		const { calls, configService } = createConfigService(["5", "60000"]);
		const service: ChallengeService = new ChallengeService({} as Repository<Challenge>, configService);

		const [first, second] = await Promise.all([service["getChallengeConfigValue"]("powCaptchaDifficulty"), service["getChallengeConfigValue"]("powCaptchaDifficulty")]);
		const third: string = await service["getChallengeConfigValue"]("powCaptchaDifficulty");
		const ttl: string = await service["getChallengeConfigValue"]("captchaTtlMs");

		assert.deepEqual([first, second, third, ttl], ["5", "5", "5", "60000"]);
		assert.deepEqual(
			calls.map((call: IGetCall) => call.name),
			["powCaptchaDifficulty", "captchaTtlMs"],
		);
	});

	void it("reads a cache miss through the caller's transaction instead of a second pool connection", async () => {
		const { calls, configService } = createConfigService(["5"]);
		const service: ChallengeService = new ChallengeService({} as Repository<Challenge>, configService);
		const transaction: object = { name: "transaction-manager" };

		await service["getChallengeConfigValue"]("powCaptchaDifficulty", transaction as never);

		assert.equal(calls[0]?.eventManager, transaction);
	});

	void it("does not cache a failed first read", async () => {
		const { calls, configService } = createConfigService([new Error("db down"), "5"]);
		const service: ChallengeService = new ChallengeService({} as Repository<Challenge>, configService);

		await assert.rejects(service["getChallengeConfigValue"]("powCaptchaDifficulty"), /db down/);
		assert.equal(await service["getChallengeConfigValue"]("powCaptchaDifficulty"), "5");
		assert.equal(calls.length, 2);
	});

	void it("serves the stale value after expiry while one background read refreshes it", async () => {
		const { calls, configService } = createConfigService(["5", "6"]);
		const service: ChallengeService = new ChallengeService({} as Repository<Challenge>, configService);

		assert.equal(await service["getChallengeConfigValue"]("powCaptchaDifficulty"), "5");
		service["CONFIG_CACHE"].get("powCaptchaDifficulty")!.expiresAt = Date.now() - 1;

		const during: Array<string> = await Promise.all([service["getChallengeConfigValue"]("powCaptchaDifficulty"), service["getChallengeConfigValue"]("powCaptchaDifficulty")]);
		await flush();

		assert.deepEqual(during, ["5", "5"]);
		assert.equal(await service["getChallengeConfigValue"]("powCaptchaDifficulty"), "6");
		assert.equal(calls.length, 2);
		assert.equal(calls[1]?.eventManager, undefined, "background refresh must not use a request transaction");
	});

	void it("keeps the stale value when a refresh fails", async () => {
		const { calls, configService } = createConfigService(["5", new Error("db down"), "7"]);
		const service: ChallengeService = new ChallengeService({} as Repository<Challenge>, configService);

		await service["getChallengeConfigValue"]("powCaptchaDifficulty");
		service["CONFIG_CACHE"].get("powCaptchaDifficulty")!.expiresAt = Date.now() - 1;

		assert.equal(await service["getChallengeConfigValue"]("powCaptchaDifficulty"), "5");
		await flush();
		assert.equal(await service["getChallengeConfigValue"]("powCaptchaDifficulty"), "5");
		await flush();
		assert.equal(await service["getChallengeConfigValue"]("powCaptchaDifficulty"), "7");
		assert.equal(calls.length, 3);
	});

	void it("preloads the challenge config on bootstrap and tolerates a failure", async () => {
		const { calls, configService } = createConfigService(["60000", new Error("missing")]);
		const service: ChallengeService = new ChallengeService({} as Repository<Challenge>, configService);

		await service.onApplicationBootstrap();

		assert.deepEqual(
			calls.map((call: IGetCall) => call.name),
			["captchaTtlMs", "powCaptchaDifficulty"],
		);
		assert.equal(service["CONFIG_CACHE"].get("captchaTtlMs")?.value, "60000");
		assert.equal(service["CONFIG_CACHE"].has("powCaptchaDifficulty"), false);
	});
});
