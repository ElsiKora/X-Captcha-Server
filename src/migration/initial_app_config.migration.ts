import type { IConfigMigrationDefinition } from "@elsikora/nestjs-crud-config";

export const initialAppConfigMigration: IConfigMigrationDefinition = {
	description: "Set up initial application configuration",

	name: "001_initial_app_config",

	async up(configService, entityManager) {
		await configService.set({
			description: "Captcha TTL in ms",
			eventManager: entityManager,
			name: "captchaTtlMs",
			section: "challenge",
			value: "60000",
		});

		await configService.set({
			description: "PoW captcha difficulty",
			eventManager: entityManager,
			name: "powCaptchaDifficulty",
			section: "challenge",
			value: "5",
		});
	},
};
