/* eslint-disable @elsikora/typescript/naming-convention */
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

import { EService, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { CorrelationIDResponseBodyInterceptor } from "@elsikora/nestjs-crud-automator";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";

import { AppModule } from "./app.module";
import ApiVersionResponseHeaderInterceptor from "./common/interceptor/api-version-response-header.interceptor";
import RemoveXPoweredByMiddleware from "./common/middleware/remove-x-powered-by.middleware";
import TraceLoggerMiddleware from "./common/middleware/trace-logger.middleware";
import ConfigSentry from "./config/sentry.config";
import ConfigSwagger from "./config/swagger.config";

/**
 * Bootstrap the application
 * @returns {Promise<number>} The port the application is running on
 */
async function bootstrap(): Promise<number> {
	const application: NestFastifyApplication = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

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
	application.use(new TraceLoggerMiddleware(application).use);
	application.setGlobalPrefix(`v${application.get(ParameterStoreConfigService).get({ path: ["api/version"], service: EService.REAPER }) ?? "1"}`);

	new ConfigSentry(application).init();
	new ConfigSwagger(application).init();

	application.useGlobalInterceptors(new ApiVersionResponseHeaderInterceptor(application));
	application.useGlobalInterceptors(new CorrelationIDResponseBodyInterceptor());
	application.enableCors();

	await application.listen(4000, application.get(ParameterStoreConfigService).get({ path: ["api/listener"], service: EService.REAPER }) ?? "0.0.0.0");

	return Number(application.get(ParameterStoreConfigService).get({ path: ["api/port"], service: EService.REAPER }));
}

bootstrap()
	.then((port: number): void => {
		Logger.log(`Running on port ${String(port)}`, "Reaper");
	})
	.catch((error: unknown): void => {
		Logger.error(error, "Reaper");
	});
