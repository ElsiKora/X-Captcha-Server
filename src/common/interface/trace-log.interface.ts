export default interface ITraceLog {
	apiKey?: string;
	contentLength: Array<string> | number | string;
	correlationID: Array<string> | string;
	ip: string;
	method: string;
	path: string;
	queryParams: {};
	request: string;
	requestTimestamp?: number;
	signature?: string;
	statusCode: number;
	timeSpent: number;
	userAgent: string;
}
