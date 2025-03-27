import type { FastifyRequest } from "fastify";

import type { Client } from "../../../modules/client/entity/client.entity";

export interface IApiAuthRequestClientSecret extends FastifyRequest {
	user: Client;
}
