import { ApiService, ApiServiceBase, ApiServiceObservable } from "@elsikora/nestjs-crud-automator";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ECaptchaType } from "../../shared/enum/captcha-type.enum";

import { Client } from "./entity/client.entity";

const CLIENT_CACHE_MAX_SIZE: number = 10_000;
const CLIENT_CACHE_TTL_MS: number = 30_000;

type TClientKeyField = "publicKey" | "secretKey";

@ApiService({ entity: Client })
@ApiServiceObservable()
@Injectable()
export default class ClientService extends ApiServiceBase<Client> {
	private readonly CLIENT_CACHE = new Map<string, { client: Client | undefined; expiresAt: number }>();

	constructor(
		@InjectRepository(Client)
		private readonly repository: Repository<Client>,
	) {
		super();
	}

	async getActiveByKey(field: TClientKeyField, key: string): Promise<Client | undefined> {
		const cacheKey: string = `${field}:${key}`;
		const cached: { client: Client | undefined; expiresAt: number } | undefined = this.CLIENT_CACHE.get(cacheKey);

		if (cached && cached.expiresAt > Date.now()) {
			return cached.client;
		}

		let client: Client | undefined;

		try {
			client = await this.get({ where: { [field]: key, isActive: true } });
		} catch (error: unknown) {
			if (!(error instanceof NotFoundException)) {
				throw error;
			}
		}

		if (this.CLIENT_CACHE.size >= CLIENT_CACHE_MAX_SIZE) {
			this.CLIENT_CACHE.clear();
		}

		this.CLIENT_CACHE.set(cacheKey, { client, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });

		return client;
	}

	hasChallengeType(client: Client, challengeType: ECaptchaType): boolean {
		return (client.challengeType ?? []).includes(challengeType);
	}
}
