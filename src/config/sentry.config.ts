import type { INestApplication } from "@nestjs/common";
import type { AbstractHttpAdapter } from "@nestjs/core";

import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import * as Sentry from "@sentry/node";

import SentryFilter from "../common/filter/sentry.filter";

export default class ConfigSentry {
	private readonly APPLICATION: INestApplication;

	constructor(application: INestApplication) {
		this.APPLICATION = application;
	}

	init(): void {
		const httpAdapter: AbstractHttpAdapter = this.APPLICATION.get(HttpAdapterHost).httpAdapter;

		Sentry.init({
			dsn: this.APPLICATION.get(ConfigService).get("SENTRY_DSN") ?? "",
		});

		this.APPLICATION.useGlobalFilters(new SentryFilter(httpAdapter));
	}
}
