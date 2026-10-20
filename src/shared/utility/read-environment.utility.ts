/**
 * Reads a boolean from an environment variable ("true"/"false", "1"/"0").
 * @param {string} name Variable name
 * @param {boolean} defaultValue Value used when the variable is unset or empty
 * @returns {boolean} The parsed value
 * @throws {Error} When the variable is set to anything else, so a typo fails the start instead of silently using the default
 */
export function readEnvironmentBoolean(name: string, defaultValue: boolean): boolean {
	const raw: string | undefined = process.env[name]?.trim().toLowerCase();

	if (raw === undefined || raw === "") {
		return defaultValue;
	}

	if (raw === "true" || raw === "1") {
		return true;
	}

	if (raw === "false" || raw === "0") {
		return false;
	}

	throw new Error(`Environment variable ${name} must be "true" or "false", got "${raw}"`);
}

/**
 * Reads a positive integer from an environment variable.
 * @param {string} name Variable name
 * @param {number} defaultValue Value used when the variable is unset or empty
 * @returns {number} The parsed value
 * @throws {Error} When the variable is not a positive integer, so a typo fails the start instead of silently using the default
 */
export function readEnvironmentPositiveInteger(name: string, defaultValue: number): number {
	const raw: string | undefined = process.env[name]?.trim();

	if (raw === undefined || raw === "") {
		return defaultValue;
	}

	if (!/^[1-9]\d{0,8}$/.test(raw)) {
		throw new Error(`Environment variable ${name} must be a positive integer, got "${raw}"`);
	}

	return Number.parseInt(raw, 10);
}
