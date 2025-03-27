import { ApiService, ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ECaptchaType } from "../../shared/enum/captcha-type.enum";

import { Client } from "./entity/client.entity";

@ApiService({ entity: Client })
@Injectable()
export default class ClientService extends ApiServiceBase<Client> {
	constructor(
		@InjectRepository(Client)
		private readonly repository: Repository<Client>,
	) {
		super();
	}

	hasChallengeType(client: Client, challengeType: ECaptchaType): boolean {
		return client.challengeType.includes(challengeType);
	}
}
