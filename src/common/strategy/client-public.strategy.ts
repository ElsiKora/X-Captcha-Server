import type { Request } from "express";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";

import ClientService from "../../modules/client/client.service";
import { Client } from "../../modules/client/entity/client.entity";

@Injectable()
export default class ClientPublicStrategy extends PassportStrategy(Strategy, "client-public-guard") {
	constructor(
		private readonly service: ClientService,
		// private readonly configService: ConfigService,
	) {
		super();
	}

	async validate(request: Request): Promise<Client> {
		const publicKey: string = request.headers["x-public-key"] as string;

		return this.validateRequestData(publicKey)
			.then((client: Client) => {
				return client;
			})
			.catch((error: unknown) => {
				if (error instanceof BadRequestException) {
					throw error;
				}

				throw new UnauthorizedException();
			});
	}

	validateRequestData(publicKey: string): Promise<Client> {
		if (publicKey == undefined || !publicKey || publicKey.length === 0) {
			throw new UnauthorizedException();
		}

		return this.service
			.get({ where: { isActive: true, publicKey } })
			.then((client: Client) => {
				return client;
			})
			.catch((error: unknown) => {
				if (error instanceof HttpException) {
					throw error;
				}

				throw new InternalServerErrorException(ErrorString({ entity: Client, type: EErrorStringAction.FETCHING_ERROR }));
			});
	}
}
