import type { ExecutionContext } from "@nestjs/common";
import type { Observable } from "rxjs";

import { AuthGuard } from "@nestjs/passport";

export default class ClientSecretGuard extends AuthGuard("client-secret-guard") {
	canActivate(context: ExecutionContext): boolean | Observable<boolean> | Promise<boolean> {
		return super.canActivate(context);
	}
}
