import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import { EService, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { CorrelationIDResponseBodyInterceptor } from "@elsikora/nestjs-crud-automator";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import * as Sentry from "@sentry/node";

import { AppModule } from "./app.module";
import TraceLoggerHook from "./common/hook/trace-logger.hook";
import ApiVersionResponseHeaderInterceptor from "./common/interceptor/api-version-response-header.interceptor";
import RemoveXPoweredByMiddleware from "./common/middleware/remove-x-powered-by.middleware";
import ConfigSentry from "./config/sentry.config";
import ConfigSwagger from "./config/swagger.config";
import CONFIG_CONSTANT from "./shared/constant/config.constant";

const UNCAUGHT_EXCEPTION_FLUSH_TIMEOUT_MS: number = 2000;

process.on("unhandledRejection", (reason: unknown) => {
	Logger.error(reason, "UnhandledRejection");
	Sentry.captureException(reason);
});

process.on("uncaughtException", (error: Error) => {
	Logger.error(error, "UncaughtException");
	Sentry.captureException(error);

	void Sentry.flush(UNCAUGHT_EXCEPTION_FLUSH_TIMEOUT_MS).finally(() => {
		process.exit(1);
	});
});

/**
 * Bootstrap the application
 * @returns {Promise<number>} The port the application is running on
 */
async function bootstrap(): Promise<number> {
	const application: NestFastifyApplication = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			bodyLimit: CONFIG_CONSTANT.HTTP_BODY_LIMIT_BYTES,
			// Requests arrive through the ALB and the local nginx, both on private addresses.
			trustProxy: ["loopback", "uniquelocal"],
		}),
	);

	application.useGlobalPipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			forbidUnknownValues: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
			whitelist: true,
		}),
	);

	application.use(new RemoveXPoweredByMiddleware().use);
	new TraceLoggerHook(application).register(application.getHttpAdapter().getInstance());
	application.setGlobalPrefix(`v${application.get(ParameterStoreConfigService).get({ path: ["api/version"], service: EService.REAPER }) ?? "1"}`);

	new ConfigSentry(application).init();
	new ConfigSwagger(application).init();

	application.useGlobalInterceptors(new ApiVersionResponseHeaderInterceptor(application));
	application.useGlobalInterceptors(new CorrelationIDResponseBodyInterceptor());
	application.enableCors();

	await application.listen(Number(application.get(ParameterStoreConfigService).get({ path: ["api/port"], service: EService.REAPER })), application.get(ParameterStoreConfigService).get({ path: ["api/listener"], service: EService.REAPER }) ?? "0.0.0.0");

	return Number(application.get(ParameterStoreConfigService).get({ path: ["api/port"], service: EService.REAPER }));
}

bootstrap()
	.then((port: number): void => {
		Logger.log(`Running on port ${String(port)}`, "Reaper");
	})
	.catch((error: unknown): void => {
		Logger.error(error, "Reaper");
	});
