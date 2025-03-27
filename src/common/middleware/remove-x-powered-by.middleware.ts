import type { NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

import { Injectable } from "@nestjs/common";

@Injectable()
export default class RemoveXPoweredByMiddleware implements NestMiddleware {
	use = (_request: Request, response: Response, next: NextFunction): void => {
		response.removeHeader("x-powered-by");
		next();
	};
}
