import type { IncomingHttpHeaders } from "node:http";

import type { PutLogEventsCommandInput } from "@aws-sdk/client-cloudwatch-logs";
import type { NestMiddleware } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { EService, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { NUMBER_CONSTANT } from "@elsikora/nestjs-crud-automator";
import { INestApplication, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Sentry from "@sentry/node";
import * as requestIp from "request-ip";
import { v4 as uuid } from "uuid";

import ITraceLog from "../interface/trace-log.interface";

@Injectable()
export default class TraceLoggerMiddleware implements NestMiddleware {
	private readonly CLOUDWATCH_LOGS: CloudWatchLogs;

	constructor(private readonly application: INestApplication) {
		this.CLOUDWATCH_LOGS = new CloudWatchLogs({
			region: this.application.get(ConfigService).get("AWS_REGION"),
		});
	}

	use = (request: FastifyRequest["raw"], response: FastifyReply["raw"], next: () => void): void => {
		const method: string = request.method ?? "";
		const url: string = request?.url?.split("?")[NUMBER_CONSTANT.ZERO_LIST_LENGTH] ?? "";
		const headers: IncomingHttpHeaders = request.headers;
		const query: Record<string, string> = Object.fromEntries(new URLSearchParams(request.url?.split("?")[1] ?? ""));

		if (method === "OPTIONS") {
			next();

			return;
		}

		const userAgent: string = headers["user-agent"] ?? uuid();
		const startTime: number = Date.now();

		const correlationHeader: Array<string> | string = headers["x-correlation-id"] ?? uuid();
		response.setHeader("X-Correlation-Id", correlationHeader);

		const bodyChunks: Array<any> = [];
		let bodyString: string;

		request.on("data", (chunk: any) => {
			bodyChunks.push(chunk);
		});

		request.on("end", () => {
			bodyString = Buffer.concat(bodyChunks).toString();

			try {
				bodyString = JSON.parse(bodyString) as string;
			} catch {
				/* empty */
			}

			const endTime: number = Date.now();
			const statusCode: number = response.statusCode;
			const contentLength: Array<string> | number | string = response.getHeader("content-length") ?? 0;

			const logData: ITraceLog = {
				contentLength,
				correlationID: correlationHeader,
				ip: requestIp.getClientIp(request) ?? "0.0.0.0",
				method: method,
				path: url,
				queryParams: query,
				request: bodyString,
				statusCode: statusCode,
				timeSpent: endTime - startTime,
				userAgent: userAgent,
			};

			if (headers["x-api-key"]) {
				logData.apiKey = Array.isArray(headers["x-api-key"]) ? headers["x-api-key"][0] : headers["x-api-key"];
			}

			if (headers["x-signature"]) {
				logData.signature = Array.isArray(headers["x-signature"]) ? headers["x-signature"][0] : headers["x-signature"];
			}

			if (headers["x-timestamp"]) {
				logData.requestTimestamp = Array.isArray(headers.requestTimestamp) ? Number(headers.requestTimestamp[0]) : Number(headers.requestTimestamp);
			}

			const parameters: PutLogEventsCommandInput = {
				logEvents: [
					{
						message: JSON.stringify(logData),
						timestamp: Date.now(),
					},
				],
				logGroupName: this.application.get(ParameterStoreConfigService).get({ path: ["logs-group-name"], service: EService.AWS_CLOUDWATCH }) ?? "",
				logStreamName: this.application.get(ParameterStoreConfigService).get({ path: ["logs-stream-name"], service: EService.AWS_CLOUDWATCH }) ?? "",
			};

			this.CLOUDWATCH_LOGS.putLogEvents(parameters, (error: Error | null) => {
				if (error) {
					Sentry.captureMessage(`CloudWatch error: ${String(error)}`, "error");
				}
			});
		});

		next();
	};
}
