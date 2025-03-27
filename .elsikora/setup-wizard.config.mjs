export default {
	ci: {
		isEnabled: true,
		isNpmPackage: false,
		moduleProperties: {
			dependabot: {
				devBranchName: "dev",
			},
			release: {
				mainBranch: "main",
				isPrerelease: true,
				preReleaseBranch: "dev",
			},
		},
		modules: ["codecommit-sync", "dependabot", "qodana", "release", "snyk"],
		provider: "GitHub",
	},
	commitlint: {
		isEnabled: true,
	},
	eslint: {
		features: ["sonar", "unicorn", "perfectionist", "jsdoc", "javascript", "typescript", "json", "yaml", "checkFile", "packageJson", "markdown", "nest", "node", "regexp", "typeorm", "prettier", "stylistic", "noSecrets"],
		isEnabled: true,
	},
	gitignore: {
		isEnabled: true,
	},
	ide: {
		ides: ["intellij-idea"],
		isEnabled: true,
	},
	license: {
		author: "ElsiKora",
		isEnabled: true,
		license: "MIT",
		year: 2025,
	},
	"lint-staged": {
		features: ["eslint", "prettier"],
		isEnabled: true,
	},
	prettier: {
		isEnabled: true,
	},
	"semantic-release": {
		developBranch: "dev",
		isBackmergeEnabled: true,
		isEnabled: true,
		isPrereleaseEnabled: true,
		mainBranch: "main",
		preReleaseBranch: "dev",
		preReleaseChannel: "beta",
		repositoryUrl: "https://github.com/ElsiKora/X-Captcha-Server.git",
	},
	stylelint: {
		isEnabled: false,
	},
};
