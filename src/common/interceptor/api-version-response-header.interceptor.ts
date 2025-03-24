import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import type { Observable } from "rxjs";

import { EService, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { INestApplication, Injectable } from "@nestjs/common";
import { map } from "rxjs/operators";

@Injectable()
export default class ApiVersionResponseHeaderInterceptor<T> implements NestInterceptor {
	constructor(private readonly application: INestApplication) {}

	intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
		const response: FastifyReply = context.switchToHttp().getResponse();

		return next.handle().pipe(
			map((data: T) => {
				void response.header("X-API-Name", "Reaper");
				void response.header("X-API-Version", `v${this.application.get(ParameterStoreConfigService).get({ path: ["api", "version"], service: EService.REAPER }) ?? "1.0"}`);

				return data;
			}),
		);
	}
}
