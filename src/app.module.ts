import { EService, ParameterStoreConfigModule, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { ApiSubscriberModule } from "@elsikora/nestjs-crud-automator";
import { CrudConfigModule, TOKEN_CONSTANT } from "@elsikora/nestjs-crud-config";
import { TypeOrmAwsConnectorModule, TypeOrmAwsConnectorService } from "@elsikora/nestjs-typeorm-aws-connector";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChallengeModule } from "./modules/challenge/challenge.module";
import { Challenge } from "./modules/challenge/entity/challenge.entity";
import { ClientModule } from "./modules/client/client.module";
import { Client } from "./modules/client/entity/client.entity";
import CONFIG_CONSTANT from "./shared/constant/config.constant";

@Module({
	imports: [
		ApiSubscriberModule,
		ChallengeModule,
		ClientModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		CrudConfigModule.registerAsync({
			imports: [ParameterStoreConfigModule],
			inject: [ParameterStoreConfigService],
			useFactory: (parameterStoreConfigService: ParameterStoreConfigService) => {
				return {
					cacheOptions: {
						isEnabled: true,
					},
					encryptionOptions: {
						encryptionKey:
							parameterStoreConfigService.get({
								path: ["crud-config/encryption-key"],
								service: EService.REAPER,
							}) ?? undefined,
						isEnabled: true,
					},
					environment: "production",
					migrationOptions: {
						isEnabled: true,
						migrations: [
							// initialAppConfigMigration,
						],
						shouldRunOnStartup: true,
						useTransaction: true,
					},
					shouldAutoCreateSections: true,
				};
			},
		}),
		EventEmitterModule.forRoot(),
		ParameterStoreConfigModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				return {
					application: config.get<string>("APPLICATION"),
					config: {
						region: config.get<string>("AWS_REGION"),
					},
					environment: config.get<string>("ENVIRONMENT"),
					shouldDecryptParameters: true,
					shouldUseRecursiveLoading: true,
				};
			},
		}),
		TypeOrmAwsConnectorModule.registerAsync({
			imports: [ConfigModule, CrudConfigModule],
			inject: [TOKEN_CONSTANT.CONFIG_SECTION_ENTITY, TOKEN_CONSTANT.CONFIG_DATA_ENTITY, TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY],
			useFactory: (sectionEntity, dataEntity, migrationEntity) => {
				return {
					connectionTimeoutMs: CONFIG_CONSTANT.DB_CONNECTION_TIMEOUT,
					databaseName: CONFIG_CONSTANT.DB_DATABASE_NAME,
					entities: [Challenge, Client, sectionEntity, dataEntity, migrationEntity],
					idleTimeoutMs: CONFIG_CONSTANT.DB_IDLE_TIMEOUT,
					isVerbose: CONFIG_CONSTANT.IS_DATABASE_LOGGING_ENABLED,
					poolSize: CONFIG_CONSTANT.DB_POOL_SIZE,
					port: CONFIG_CONSTANT.DB_PORT,
					rotation: {
						intervalMs: CONFIG_CONSTANT.DATABASE_CONNECTION_ROTATION_INTERVAL,
						isEnabled: CONFIG_CONSTANT.IS_DATABASE_CONNECTION_ROTATION_ENABLED,
					},
					shouldSynchronize: CONFIG_CONSTANT.IS_DATABASE_SYNCHRONIZATION_ENABLED,
					type: CONFIG_CONSTANT.DB_TYPE,
				};
			},
		}),
		TypeOrmModule.forRootAsync({
			inject: [TypeOrmAwsConnectorService],
			useFactory: async (service: TypeOrmAwsConnectorService) => {
				return {
					...(await service.getTypeOrmOptions()),
				};
			},
		}),
	],
})
export class AppModule {}
