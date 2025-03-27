import type { ArgumentsHost, HttpServer } from "@nestjs/common";
import type { AbstractHttpAdapter } from "@nestjs/core";

import { Catch } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import * as Sentry from "@sentry/node";

@Catch()
export default class SentryFilter extends BaseExceptionFilter {
	handleUnknownError(exception: Sentry.Exception, host: ArgumentsHost, applicationReference: AbstractHttpAdapter | HttpServer): void {
		Sentry.captureException(exception);
		super.handleUnknownError(exception, host, applicationReference);
	}
}
