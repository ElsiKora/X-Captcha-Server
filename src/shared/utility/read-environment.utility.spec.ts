import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import { readEnvironmentBoolean, readEnvironmentPositiveInteger } from "./read-environment.utility";

const NAME: string = "X_CAPTCHA_TEST_VARIABLE";

void describe("readEnvironmentPositiveInteger", () => {
	afterEach(() => {
		// eslint-disable-next-line @elsikora/typescript/no-dynamic-delete
		delete process.env[NAME];
	});

	void it("returns the default when unset or empty", () => {
		assert.equal(readEnvironmentPositiveInteger(NAME, 7), 7);
		process.env[NAME] = " ";
		assert.equal(readEnvironmentPositiveInteger(NAME, 7), 7);
	});

	void it("parses a positive integer", () => {
		process.env[NAME] = "40";
		assert.equal(readEnvironmentPositiveInteger(NAME, 7), 40);
	});

	for (const invalid of ["0", "-1", "1.5", "abc", "10abc", "0x10", "1e3"]) {
		void it(`rejects "${invalid}"`, () => {
			process.env[NAME] = invalid;
			assert.throws(() => readEnvironmentPositiveInteger(NAME, 7), /must be a positive integer/);
		});
	}
});

void describe("readEnvironmentBoolean", () => {
	afterEach(() => {
		// eslint-disable-next-line @elsikora/typescript/no-dynamic-delete
		delete process.env[NAME];
	});

	void it("returns the default when unset", () => {
		assert.equal(readEnvironmentBoolean(NAME, true), true);
		assert.equal(readEnvironmentBoolean(NAME, false), false);
	});

	void it("parses true/false/1/0", () => {
		for (const [raw, expected] of [
			["true", true],
			["TRUE", true],
			["1", true],
			["false", false],
			["0", false],
		] as const) {
			process.env[NAME] = raw;
			assert.equal(readEnvironmentBoolean(NAME, !expected), expected);
		}
	});

	void it("rejects anything else", () => {
		process.env[NAME] = "yes";
		assert.throws(() => readEnvironmentBoolean(NAME, false), /must be "true" or "false"/);
	});
});

void describe("CONFIG_CONSTANT environment overrides", () => {
	const constantPath: string = path.join(__dirname, "..", "constant", "config.constant.js");

	function readConstant(environment: Record<string, string>): Record<string, unknown> {
		const output: string = execFileSync(process.execPath, ["-e", `process.stdout.write(JSON.stringify(require(${JSON.stringify(constantPath)}).default))`], { env: { PATH: process.env.PATH, ...environment } }).toString();

		return JSON.parse(output) as Record<string, unknown>;
	}

	void it("keeps the production defaults when nothing is set", () => {
		const constant: Record<string, unknown> = readConstant({});

		assert.equal(constant.DB_POOL_SIZE, 20);
		assert.equal(constant.THROTTLE_LIMIT, 60);
		assert.equal(constant.CHALLENGE_SOLUTION_TTL_SECONDS, 120);
		assert.equal(constant.IS_DATABASE_SYNCHRONIZATION_ENABLED, false);
		assert.equal(constant.IS_CLUSTER_LEADER, true);
		assert.equal(constant.CLUSTER_WORKER_COUNT, os.cpus().length);
	});

	void it("reads the overrides", () => {
		const constant: Record<string, unknown> = readConstant({ CHALLENGE_SOLUTION_TTL_SECONDS: "30", CLUSTER_WORKER_COUNT: "8", DB_POOL_SIZE: "35", IS_DATABASE_SYNCHRONIZATION_ENABLED: "true", THROTTLE_LIMIT: "100" });

		assert.equal(constant.DB_POOL_SIZE, 35);
		assert.equal(constant.THROTTLE_LIMIT, 100);
		assert.equal(constant.CHALLENGE_SOLUTION_TTL_SECONDS, 30);
		assert.equal(constant.CLUSTER_WORKER_COUNT, 8);
		assert.equal(constant.IS_DATABASE_SYNCHRONIZATION_ENABLED, true);
	});

	void it("never lets a follower worker synchronize the schema or run config migrations", () => {
		const scriptPath: string = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "x-captcha-config-")), "follower.js");
		fs.writeFileSync(
			scriptPath,
			`const cluster = require("node:cluster");
if (cluster.isPrimary) {
	cluster.fork({ CLUSTER_ROLE: "follower" }).on("message", (message) => { process.stdout.write(JSON.stringify(message)); process.exit(0); });
} else {
	const constant = require(${JSON.stringify(constantPath)}).default;
	process.send({ leader: constant.IS_CLUSTER_LEADER, migrations: constant.IS_CONFIG_MIGRATION_ENABLED, sync: constant.IS_DATABASE_SYNCHRONIZATION_ENABLED });
}`,
		);

		const output: string = execFileSync(process.execPath, [scriptPath], { env: { IS_DATABASE_SYNCHRONIZATION_ENABLED: "true", PATH: process.env.PATH } }).toString();

		assert.deepEqual(JSON.parse(output), { leader: false, migrations: false, sync: false });
	});
});
