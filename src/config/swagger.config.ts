import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";

import * as fs from "node:fs";
import * as process from "node:process";

import { EService, ParameterStoreConfigService } from "@elsikora/nestjs-aws-parameter-store-config";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import CONFIG_CONSTANT from "../shared/constant/config.constant";
import CONFIG_SWAGGER_CONSTANT from "../shared/constant/swagger.constant";

export default class ConfigSwagger {
	private readonly APPLICATION: INestApplication;

	private readonly APPLICATION_NAME: string;

	constructor(application: INestApplication) {
		this.APPLICATION = application;
		this.APPLICATION_NAME = this.APPLICATION.get(ConfigService).get<string>("APPLICATION")?.toUpperCase() ?? "APPLICATION";
	}

	init(): void {
		const config: Omit<OpenAPIObject, "paths"> = new DocumentBuilder()
			.setTitle(this.APPLICATION_NAME)
			.setDescription(`${this.APPLICATION_NAME} \`Reaper API\` documentation`)
			.setLicense("Apache 2.0", "https://www.apache.org/licenses/LICENSE-2.0.html")
			.setTermsOfService(this.APPLICATION.get(ParameterStoreConfigService).get({ path: ["api", "terms-url"], service: EService.REAPER }) ?? "")
			.setVersion(this.APPLICATION.get(ParameterStoreConfigService).get({ path: ["api", "version"], service: EService.REAPER }) ?? "1.0")
			.addServer(this.APPLICATION.get(ConfigService).get<string>("NODE_ENV") === "production" ? (this.APPLICATION.get(ParameterStoreConfigService).get({ path: ["api", "url"], service: EService.REAPER }) ?? "") : "http://127.0.0.1:4000")
			.addApiKey(
				{
					description: "Public key",
					name: "X-Public-Key",
					type: "apiKey",
				},
				"publicAuthorization",
			)
			.addApiKey(
				{
					description: "Secret key",
					name: "X-Secret-Key",
					type: "apiKey",
				},
				"secretAuthorization",
			)
			.build();

		const document: OpenAPIObject = SwaggerModule.createDocument(this.APPLICATION, config);

		SwaggerModule.setup("api", this.APPLICATION, document, {
			swaggerOptions: {
				// eslint-disable-next-line @elsikora/typescript/naming-convention
				deepScanRoutes: CONFIG_SWAGGER_CONSTANT.SHOULD_DEEP_SCAN_ROUTES,
				// eslint-disable-next-line @elsikora/typescript/naming-convention
				displayRequestDuration: CONFIG_SWAGGER_CONSTANT.SHOULD_DISPLAY_REQUEST_DURATION,
				operationsSorter: CONFIG_SWAGGER_CONSTANT.OPERATIONS_SORTER,
				tagsSorter: CONFIG_SWAGGER_CONSTANT.TAGS_SORTER,
			},
		});

		if (this.APPLICATION.get(ConfigService).get("NODE_ENV") === "generate-swagger") {
			fs.writeFileSync("./dist/swagger.json", JSON.stringify(document, undefined, CONFIG_CONSTANT.SWAGGER_SAVE_SPACES), "utf8");

			// eslint-disable-next-line @elsikora/unicorn/no-process-exit
			process.exit(0);
		}
	}
}
