import type { Request } from "express";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";

import ClientService from "../../modules/client/client.service";
import { Client } from "../../modules/client/entity/client.entity";

@Injectable()
export default class ClientSecretStrategy extends PassportStrategy(Strategy, "client-secret-guard") {
	constructor(private readonly service: ClientService) {
		super();
	}

	async validate(request: Request): Promise<any> {
		const secretcKey: string = request.headers["x-secret-key"] as string;

		return this.validateRequestData(secretcKey)
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

	validateRequestData(secretKey: string): Promise<Client> {
		if (secretKey == undefined || !secretKey || secretKey.length === 0) {
			throw new UnauthorizedException();
		}

		return this.service
			.get({ where: { isActive: true, secretKey } })
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
