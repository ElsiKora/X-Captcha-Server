import type { ChildProcess } from "node:child_process";

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

const WORKER_COUNT: number = 4;
const WAIT_TIMEOUT_MS: number = 20_000;

interface IWorkerInfo {
	pid: number;
	role: string;
}

const temporaryDirectory: string = fs.mkdtempSync(path.join(os.tmpdir(), "x-captcha-cluster-"));
const fixturePath: string = path.join(temporaryDirectory, "fixture.js");

fs.writeFileSync(
	fixturePath,
	`
const cluster = require("node:cluster");
const fs = require("node:fs");
const http = require("node:http");

if (cluster.isPrimary) {
	const ClusterPrimary = require(${JSON.stringify(path.join(__dirname, "cluster-primary.js"))}).default;
	new ClusterPrimary(${String(WORKER_COUNT)}, 50).start();
} else {
	const role = process.env.CLUSTER_ROLE;
	const failMarker = process.env.FAIL_LEADER_ONCE_FILE;

	if (role === "leader" && failMarker && !fs.existsSync(failMarker)) {
		fs.writeFileSync(failMarker, "");
		process.exit(1);
	}

	http.createServer((request, response) => {
		response.setHeader("connection", "close");
		response.end(JSON.stringify({ pid: process.pid, role }));
		if (request.url === "/crash") process.exit(1);
	}).listen(Number(process.env.PORT), "127.0.0.1");
}
`,
);

after(() => {
	fs.rmSync(temporaryDirectory, { force: true, recursive: true });
});

function getFreePort(): Promise<number> {
	return new Promise((resolve: (port: number) => void, reject: (error: Error) => void) => {
		const server: net.Server = net.createServer();
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const { port } = server.address() as net.AddressInfo;
			server.close(() => {
				resolve(port);
			});
		});
	});
}

function request(port: number, urlPath: string = "/"): Promise<IWorkerInfo | undefined> {
	return new Promise((resolve: (value: IWorkerInfo | undefined) => void) => {
		const outgoing: http.ClientRequest = http.get({ agent: false, host: "127.0.0.1", path: urlPath, port }, (response: http.IncomingMessage) => {
			let body: string = "";
			response.on("data", (chunk: Buffer) => (body += chunk.toString()));
			response.on("end", () => {
				resolve(JSON.parse(body) as IWorkerInfo);
			});
		});
		outgoing.on("error", () => {
			resolve(undefined);
		});
	});
}

/**
 * Polls until `count` distinct live workers answered within one sampling round.
 * @param {number} port Port the cluster listens on
 * @param {number} count Expected number of workers
 * @returns {Promise<Map<number, string>>} pid -> role
 */
async function waitForWorkers(port: number, count: number): Promise<Map<number, string>> {
	const deadline: number = Date.now() + WAIT_TIMEOUT_MS;

	while (Date.now() < deadline) {
		const seen: Map<number, string> = new Map();

		for (let index: number = 0; index < count * 10; index++) {
			const info: IWorkerInfo | undefined = await request(port);

			if (info) {
				seen.set(info.pid, info.role);
			}
		}

		if (seen.size === count) {
			return seen;
		}

		await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 200));
	}

	throw new Error(`Did not see ${String(count)} workers in time`);
}

function waitForExit(child: ChildProcess): Promise<null | number> {
	return new Promise((resolve: (code: null | number) => void) => {
		if (child.exitCode !== null) {
			resolve(child.exitCode);

			return;
		}

		child.once("exit", (code: null | number) => {
			resolve(code);
		});
	});
}

function isAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);

		return true;
	} catch {
		return false;
	}
}

void describe("ClusterPrimary", () => {
	void it("starts one leader plus followers, replaces a crashed worker and stops all workers on SIGTERM", async () => {
		const port: number = await getFreePort();
		const child: ChildProcess = spawn(process.execPath, [fixturePath], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });

		try {
			const workers: Map<number, string> = await waitForWorkers(port, WORKER_COUNT);
			assert.equal([...workers.values()].filter((role: string) => role === "leader").length, 1);
			assert.equal([...workers.values()].filter((role: string) => role === "follower").length, WORKER_COUNT - 1);

			const crashed: IWorkerInfo | undefined = await request(port, "/crash");
			assert.ok(crashed);

			const replaced: Map<number, string> = await waitForWorkers(port, WORKER_COUNT);
			assert.ok(!replaced.has(crashed.pid), "crashed worker must be gone");
			assert.ok([...replaced.values()].filter((role: string) => role === "leader").length <= 1, "never more than one leader");

			child.kill("SIGTERM");
			assert.equal(await waitForExit(child), 0);
			await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 300));

			for (const pid of replaced.keys()) {
				assert.equal(isAlive(pid), false, `worker ${String(pid)} must be stopped`);
			}
		} finally {
			child.kill("SIGKILL");
		}
	});

	void it("retries the leader before forking followers when the leader fails to start", async () => {
		const port: number = await getFreePort();
		const failMarker: string = path.join(temporaryDirectory, "leader-failed-once");
		const child: ChildProcess = spawn(process.execPath, [fixturePath], { env: { ...process.env, FAIL_LEADER_ONCE_FILE: failMarker, PORT: String(port) }, stdio: "ignore" });

		try {
			const workers: Map<number, string> = await waitForWorkers(port, WORKER_COUNT);
			assert.ok(fs.existsSync(failMarker), "first leader must have failed");
			assert.equal([...workers.values()].filter((role: string) => role === "leader").length, 1);
		} finally {
			child.kill("SIGTERM");
			await waitForExit(child);
		}
	});
});
