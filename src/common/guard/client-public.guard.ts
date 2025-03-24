import type { ExecutionContext } from "@nestjs/common";
import type { Observable } from "rxjs";

import { AuthGuard } from "@nestjs/passport";

export default class ClientPublicGuard extends AuthGuard("client-public-guard") {
	canActivate(context: ExecutionContext): boolean | Observable<boolean> | Promise<boolean> {
		return super.canActivate(context);
	}
}
