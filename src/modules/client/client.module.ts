import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import ClientPublicStrategy from "../../common/strategy/client-public.strategy";
import ClientSecretStrategy from "../../common/strategy/client-secret.strategy";

import ClientController from "./client.controller";
import ClientService from "./client.service";
import { Client } from "./entity/client.entity";

@Module({
	controllers: [ClientController],
	exports: [ClientService],
	imports: [TypeOrmModule.forFeature([Client])],
	providers: [ClientPublicStrategy, ClientSecretStrategy, ClientService],
})
export class ClientModule {}
