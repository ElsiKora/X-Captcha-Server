import { applyDecorators, UseGuards } from "@nestjs/common";

import ClientPublicGuard from "../../common/guard/client-public.guard";
import ClientSecretGuard from "../../common/guard/client-secret.guard";

/**
 * @returns {void}
 */
// eslint-disable-next-line @elsikora/typescript/no-unnecessary-type-parameters,@elsikora/typescript/no-unsafe-function-type
export function PublicProtected(): <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void {
	return applyDecorators(UseGuards(ClientPublicGuard));
}

/**
 * @returns {void}
 */
// eslint-disable-next-line @elsikora/typescript/no-unnecessary-type-parameters,@elsikora/typescript/no-unsafe-function-type
export function SecretProtected(): <TFunction extends Function, Y>(target: object | TFunction, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void {
	return applyDecorators(UseGuards(ClientSecretGuard));
}
