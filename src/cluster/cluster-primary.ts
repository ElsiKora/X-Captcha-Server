import type { Worker } from "node:cluster";

import cluster from "node:cluster";

import { Logger } from "@nestjs/common";

const MIN_RESTART_DELAY_MS: number = 1000;
const MAX_RESTART_DELAY_MS: number = 30_000;
// A worker that dies sooner than this after the previous restart counts as a crash loop and doubles the delay.
const RESTART_WINDOW_MS: number = 30_000;
const SHUTDOWN_TIMEOUT_MS: number = 10_000;

/**
 * Runs in the cluster primary: forks the workers, restarts the ones that die and forwards shutdown signals.
 *
 * The first worker is the leader: it starts alone and is the only one allowed to synchronize the schema and run config migrations.
 * The remaining workers are forked once the leader listens, staggered so that Parameter Store, Secrets Manager and the database
 * do not get every worker's start-up burst at the same moment.
 */
export default class ClusterPrimary {
	private hasLeaderStarted: boolean = false;

	private isShuttingDown: boolean = false;

	private lastRestartAt: number = 0;

	private readonly LOGGER: Logger = new Logger("Cluster");

	private restartDelayMs: number = MIN_RESTART_DELAY_MS;

	constructor(
		private readonly workerCount: number,
		private readonly forkStaggerMs: number,
	) {}

	start(): void {
		this.LOGGER.log(`Primary ${String(process.pid)} starting ${String(this.workerCount)} workers`);

		cluster.on("exit", (worker: Worker, code: null | number, signal: null | string) => {
			this.handleExit(worker, code, signal);
		});

		process.on("SIGTERM", () => {
			this.shutdown("SIGTERM");
		});

		process.on("SIGINT", () => {
			this.shutdown("SIGINT");
		});

		this.forkLeader();
	}

	private forkFollower(): void {
		if (this.isShuttingDown) {
			return;
		}

		cluster.fork({ CLUSTER_ROLE: "follower" });
	}

	private forkLeader(): void {
		if (this.isShuttingDown) {
			return;
		}

		const leader: Worker = cluster.fork({ CLUSTER_ROLE: "leader" });

		leader.once("listening", () => {
			this.hasLeaderStarted = true;
			this.LOGGER.log(`Leader worker ${String(leader.process.pid)} is listening, forking ${String(this.workerCount - 1)} more`);

			for (let index: number = 1; index < this.workerCount; index++) {
				setTimeout(() => {
					this.forkFollower();
				}, index * this.forkStaggerMs);
			}
		});
	}

	private handleExit(worker: Worker, code: null | number, signal: null | string): void {
		if (this.isShuttingDown) {
			if (Object.keys(cluster.workers ?? {}).length === 0) {
				this.LOGGER.log("All workers stopped");
				// eslint-disable-next-line @elsikora/unicorn/no-process-exit
				process.exit(0);
			}

			return;
		}

		const now: number = Date.now();
		this.restartDelayMs = now - this.lastRestartAt < RESTART_WINDOW_MS ? Math.min(this.restartDelayMs * 2, MAX_RESTART_DELAY_MS) : MIN_RESTART_DELAY_MS;
		this.lastRestartAt = now;

		// Until the leader has started once, the schema may not be ready, so a replacement must be a leader again.
		const isLeaderReplacement: boolean = !this.hasLeaderStarted;

		this.LOGGER.error(`Worker ${String(worker.process.pid)} exited (code ${String(code)}, signal ${String(signal)}), restarting ${isLeaderReplacement ? "leader" : "worker"} in ${String(this.restartDelayMs)} ms`);

		setTimeout(() => {
			if (isLeaderReplacement) {
				this.forkLeader();
			} else {
				this.forkFollower();
			}
		}, this.restartDelayMs);
	}

	private shutdown(signal: "SIGINT" | "SIGTERM"): void {
		if (this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;
		this.LOGGER.log(`Received ${signal}, stopping workers`);

		const workers: Array<undefined | Worker> = Object.values(cluster.workers ?? {});

		if (workers.length === 0) {
			// eslint-disable-next-line @elsikora/unicorn/no-process-exit
			process.exit(0);
		}

		for (const worker of workers) {
			worker?.process.kill(signal);
		}

		setTimeout(() => {
			this.LOGGER.warn("Workers did not stop in time, exiting");
			// eslint-disable-next-line @elsikora/unicorn/no-process-exit
			process.exit(0);
		}, SHUTDOWN_TIMEOUT_MS).unref();
	}
}
