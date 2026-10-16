const MAX_CLIENT_KEY_LENGTH: number = 128;

/**
 * Extracts a client key from a request header, rejecting repeated or oversized values.
 * @param {Array<string> | string | undefined} header Raw header value
 * @returns {string | undefined} The key, or undefined when the header is unusable
 */
export function readClientKeyHeader(header: Array<string> | string | undefined): string | undefined {
	if (typeof header !== "string") {
		return undefined;
	}

	const key: string = header.trim();

	if (key.length === 0 || key.length > MAX_CLIENT_KEY_LENGTH) {
		return undefined;
	}

	return key;
}
