import type { Request } from "express";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";

import ClientService from "../../modules/client/client.service";
import { Client } from "../../modules/client/entity/client.entity";
import { readClientKeyHeader } from "../utility/read-client-key-header.utility";

@Injectable()
export default class ClientSecretStrategy extends PassportStrategy(Strategy, "client-secret-guard") {
	constructor(private readonly service: ClientService) {
		super();
	}

	async validate(request: Request): Promise<Client> {
		const headerValue: string | undefined = readClientKeyHeader(request.headers["x-secret-key"]);

		if (!headerValue) {
			throw new UnauthorizedException();
		}

		let client: Client | undefined;

		try {
			client = await this.service.getActiveByKey("secretKey", headerValue);
		} catch {
			throw new InternalServerErrorException(ErrorString({ entity: Client, type: EErrorStringAction.FETCHING_ERROR }));
		}

		if (!client) {
			throw new UnauthorizedException();
		}

		return client;
	}
}
