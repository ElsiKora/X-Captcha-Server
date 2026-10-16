import type { InputLogEvent } from "@aws-sdk/client-cloudwatch-logs";
import type { INestApplication } from "@nestjs/common";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type ITraceLog from "../interface/trace-log.interface";

import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { EService, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { ConfigService } from "@nestjs/config";
import * as Sentry from "@sentry/node";
import { v4 as uuid } from "uuid";

const CORRELATION_ID_PATTERN: RegExp = /^[\w-]{1,64}$/;
const FLUSH_INTERVAL_MS: number = 2000;
const MAX_BATCH_SIZE: number = 200;
const MAX_HEADER_LENGTH: number = 256;
const MAX_QUEUE_SIZE: number = 10_000;
const MAX_REQUEST_BODY_LENGTH: number = 2048;

export default class TraceLoggerHook {
	private readonly CLOUDWATCH_LOGS: CloudWatchLogs;

	private isFlushing: boolean = false;

	private readonly LOG_GROUP_NAME: string;

	private readonly LOG_STREAM_NAME: string;

	private readonly QUEUE: Array<InputLogEvent> = [];

	constructor(private readonly application: INestApplication) {
		this.CLOUDWATCH_LOGS = new CloudWatchLogs({
			region: this.application.get(ConfigService).get("AWS_REGION"),
		});

		const parameterStore: ParameterStoreConfigService = this.application.get(ParameterStoreConfigService);
		this.LOG_GROUP_NAME = parameterStore.get({ path: ["logs-group-name"], service: EService.AWS_CLOUDWATCH }) ?? "";
		this.LOG_STREAM_NAME = parameterStore.get({ path: ["logs-stream-name"], service: EService.AWS_CLOUDWATCH }) ?? "";
	}

	register(instance: FastifyInstance): void {
		instance.addHook("onRequest", (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
			const header: Array<string> | string | undefined = request.headers["x-correlation-id"];
			const candidate: string | undefined = Array.isArray(header) ? header[0] : header;
			void reply.header("X-Correlation-Id", candidate && CORRELATION_ID_PATTERN.test(candidate) ? candidate : uuid());
			done();
		});

		instance.addHook("onResponse", (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
			try {
				if (request.method !== "OPTIONS") {
					this.enqueue(this.buildLog(request, reply));
				}
			} catch (error: unknown) {
				Sentry.captureException(error);
			}

			done();
		});

		setInterval(() => {
			void this.flush();
		}, FLUSH_INTERVAL_MS).unref();
	}

	private buildLog(request: FastifyRequest, reply: FastifyReply): ITraceLog {
		const [path, queryString] = request.url.split("?");
		const contentLength: Array<string> | number | string | undefined = reply.getHeader("content-length");

		const logData: ITraceLog = {
			contentLength: contentLength ?? 0,
			correlationID: String(reply.getHeader("X-Correlation-Id") ?? ""),
			ip: request.ip,
			method: request.method,
			path: path ?? "",
			queryParams: Object.fromEntries(new URLSearchParams(queryString ?? "")),
			request: this.serializeBody(request.body),
			statusCode: reply.statusCode,
			timeSpent: Math.round(reply.elapsedTime),
			userAgent: this.readHeader(request, "user-agent") ?? "",
		};

		const apiHeader: string | undefined = this.readHeader(request, "x-api-key");

		if (apiHeader) {
			logData.apiKey = apiHeader;
		}

		const signature: string | undefined = this.readHeader(request, "x-signature");

		if (signature) {
			logData.signature = signature;
		}

		const timestamp: string | undefined = this.readHeader(request, "x-timestamp");

		if (timestamp) {
			logData.requestTimestamp = Number(timestamp);
		}

		return logData;
	}

	private enqueue(logData: ITraceLog): void {
		if (this.QUEUE.length >= MAX_QUEUE_SIZE) {
			return;
		}

		this.QUEUE.push({ message: JSON.stringify(logData), timestamp: Date.now() });

		if (this.QUEUE.length >= MAX_BATCH_SIZE) {
			void this.flush();
		}
	}

	private async flush(): Promise<void> {
		if (this.isFlushing || this.QUEUE.length === 0 || !this.LOG_GROUP_NAME || !this.LOG_STREAM_NAME) {
			return;
		}

		this.isFlushing = true;

		try {
			while (this.QUEUE.length > 0) {
				const batch: Array<InputLogEvent> = this.QUEUE.splice(0, MAX_BATCH_SIZE);
				batch.sort((a: InputLogEvent, b: InputLogEvent) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

				await this.CLOUDWATCH_LOGS.putLogEvents({
					logEvents: batch,
					logGroupName: this.LOG_GROUP_NAME,
					logStreamName: this.LOG_STREAM_NAME,
				});
			}
		} catch (error: unknown) {
			Sentry.captureMessage(`CloudWatch error: ${String(error)}`, "error");
		} finally {
			this.isFlushing = false;
		}
	}

	private readHeader(request: FastifyRequest, name: string): string | undefined {
		const value: Array<string> | string | undefined = request.headers[name];
		const header: string | undefined = Array.isArray(value) ? value[0] : value;

		return header?.slice(0, MAX_HEADER_LENGTH);
	}

	private serializeBody(body: unknown): unknown {
		if (body === undefined || body === null) {
			return undefined;
		}

		const serialized: string = typeof body === "string" ? body : JSON.stringify(body);

		if (serialized.length > MAX_REQUEST_BODY_LENGTH) {
			return `${serialized.slice(0, MAX_REQUEST_BODY_LENGTH)}…[truncated]`;
		}

		return body;
	}
}
