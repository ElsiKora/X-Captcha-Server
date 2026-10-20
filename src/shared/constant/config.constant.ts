import cluster from "node:cluster";
import os from "node:os";

import { EDatabaseType } from "@elsikora/nestjs-typeorm-aws-connector";

import { readEnvironmentBoolean, readEnvironmentPositiveInteger } from "../utility/read-environment.utility";

// Without cluster mode the single process is the leader; in cluster mode the primary marks exactly one worker as leader.
const IS_CLUSTER_LEADER: boolean = cluster.isPrimary || process.env.CLUSTER_ROLE === "leader";

const SWAGGER_SAVE_SPACES: number = 2;
const DB_CONNECTION_TIMEOUT: number = 2000;
const DB_IDLE_TIMEOUT: number = 30_000;
const DB_RECONNECT_TIMEOUT: number = 3000;
// Per process: each cluster worker opens its own pool.
const DB_POOL_SIZE: number = readEnvironmentPositiveInteger("DB_POOL_SIZE", 20);
const HTTP_BODY_LIMIT_BYTES: number = 16_384;
// Per process: the throttler storage is in memory, so the effective limit per client IP is THROTTLE_LIMIT x CLUSTER_WORKER_COUNT per instance.
const THROTTLE_LIMIT: number = readEnvironmentPositiveInteger("THROTTLE_LIMIT", 60);
const THROTTLE_TTL_MS: number = 60_000;
const DB_PORT: number = 5432;
const DB_RELATION_LOAD_STRATEGY: "join" | "query" | undefined = "query";
// Schema synchronization and config migrations run in the leader only, so workers never race on DDL.
const IS_DATABASE_SYNCHRONIZATION_ENABLED: boolean = IS_CLUSTER_LEADER && readEnvironmentBoolean("IS_DATABASE_SYNCHRONIZATION_ENABLED", false);
const IS_CONFIG_MIGRATION_ENABLED: boolean = IS_CLUSTER_LEADER;
const CLUSTER_WORKER_COUNT: number = readEnvironmentPositiveInteger("CLUSTER_WORKER_COUNT", os.cpus().length);
const CLUSTER_FORK_STAGGER_MS: number = readEnvironmentPositiveInteger("CLUSTER_FORK_STAGGER_MS", 300);
// How long a solved challenge token stays valid for verify, counted from the moment it was solved.
const CHALLENGE_SOLUTION_TTL_SECONDS: number = readEnvironmentPositiveInteger("CHALLENGE_SOLUTION_TTL_SECONDS", 120);
const DB_TYPE: EDatabaseType = EDatabaseType.POSTGRES;
const IS_DATABASE_LOGGING_ENABLED: boolean = false;
const DB_DATABASE_NAME: string = "app";
const DATABASE_CONNECTION_ROTATION_INTERVAL: number = 600_000;
const IS_DATABASE_CONNECTION_ROTATION_ENABLED: boolean = true;

const CONFIG_CONSTANT: {
	readonly CHALLENGE_SOLUTION_TTL_SECONDS: number;
	readonly CLUSTER_FORK_STAGGER_MS: number;
	readonly CLUSTER_WORKER_COUNT: number;
	readonly DATABASE_CONNECTION_ROTATION_INTERVAL: number;
	readonly DB_CONNECTION_TIMEOUT: number;
	readonly DB_DATABASE_NAME: string;
	readonly DB_IDLE_TIMEOUT: number;
	readonly DB_POOL_SIZE: number;
	readonly DB_PORT: number;
	readonly DB_RECONNECT_TIMEOUT: number;
	readonly DB_RELATION_LOAD_STRATEGY: "join" | "query" | undefined;
	readonly DB_TYPE: EDatabaseType;
	readonly HTTP_BODY_LIMIT_BYTES: number;
	readonly IS_CLUSTER_LEADER: boolean;
	readonly IS_CONFIG_MIGRATION_ENABLED: boolean;
	readonly IS_DATABASE_CONNECTION_ROTATION_ENABLED: boolean;
	readonly IS_DATABASE_LOGGING_ENABLED: boolean;
	readonly IS_DATABASE_SYNCHRONIZATION_ENABLED: boolean;
	readonly SWAGGER_SAVE_SPACES: number;
	readonly THROTTLE_LIMIT: number;
	readonly THROTTLE_TTL_MS: number;
} = {
	CHALLENGE_SOLUTION_TTL_SECONDS,
	CLUSTER_FORK_STAGGER_MS,
	CLUSTER_WORKER_COUNT,
	DATABASE_CONNECTION_ROTATION_INTERVAL,
	DB_CONNECTION_TIMEOUT,
	DB_DATABASE_NAME,
	DB_IDLE_TIMEOUT,
	DB_POOL_SIZE,
	DB_PORT,
	DB_RECONNECT_TIMEOUT,
	DB_RELATION_LOAD_STRATEGY,
	DB_TYPE,
	HTTP_BODY_LIMIT_BYTES,
	IS_CLUSTER_LEADER,
	IS_CONFIG_MIGRATION_ENABLED,
	IS_DATABASE_CONNECTION_ROTATION_ENABLED,
	IS_DATABASE_LOGGING_ENABLED,
	IS_DATABASE_SYNCHRONIZATION_ENABLED,
	SWAGGER_SAVE_SPACES,
	THROTTLE_LIMIT,
	THROTTLE_TTL_MS,
} as const;
export default CONFIG_CONSTANT;
