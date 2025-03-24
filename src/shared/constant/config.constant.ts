import { EDatabaseType } from "@elsikora/nestjs-typeorm-aws-connector";

const SWAGGER_SAVE_SPACES: number = 2;
const DB_CONNECTION_TIMEOUT: number = 2000;
const DB_IDLE_TIMEOUT: number = 30_000;
const DB_RECONNECT_TIMEOUT: number = 3000;
const DB_POOL_SIZE: number = 10;
const DB_PORT: number = 5432;
const DB_RELATION_LOAD_STRATEGY: "join" | "query" | undefined = "query";
const IS_DATABASE_SYNCHRONIZATION_ENABLED: boolean = false;
const DB_TYPE: EDatabaseType = EDatabaseType.POSTGRES;
const IS_DATABASE_LOGGING_ENABLED: boolean = false;
const DB_DATABASE_NAME: string = "app";
const DATABASE_CONNECTION_ROTATION_INTERVAL: number = 600_000;
const IS_DATABASE_CONNECTION_ROTATION_ENABLED: boolean = true;

const CONFIG_CONSTANT: {
	readonly DATABASE_CONNECTION_ROTATION_INTERVAL: number;
	readonly DB_CONNECTION_TIMEOUT: number;
	readonly DB_DATABASE_NAME: string;
	readonly DB_IDLE_TIMEOUT: number;
	readonly DB_POOL_SIZE: number;
	readonly DB_PORT: number;
	readonly DB_RECONNECT_TIMEOUT: number;
	readonly DB_RELATION_LOAD_STRATEGY: "join" | "query" | undefined;
	readonly DB_TYPE: EDatabaseType;
	readonly IS_DATABASE_CONNECTION_ROTATION_ENABLED: boolean;
	readonly IS_DATABASE_LOGGING_ENABLED: boolean;
	readonly IS_DATABASE_SYNCHRONIZATION_ENABLED: boolean;
	readonly SWAGGER_SAVE_SPACES: number;
} = {
	DATABASE_CONNECTION_ROTATION_INTERVAL,
	DB_CONNECTION_TIMEOUT,
	DB_DATABASE_NAME,
	DB_IDLE_TIMEOUT,
	DB_POOL_SIZE,
	DB_PORT,
	DB_RECONNECT_TIMEOUT,
	DB_RELATION_LOAD_STRATEGY,
	DB_TYPE,
	IS_DATABASE_CONNECTION_ROTATION_ENABLED,
	IS_DATABASE_LOGGING_ENABLED,
	IS_DATABASE_SYNCHRONIZATION_ENABLED,
	SWAGGER_SAVE_SPACES,
} as const;
export default CONFIG_CONSTANT;
