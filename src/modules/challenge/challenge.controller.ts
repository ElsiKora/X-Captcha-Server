import { ApiController, ApiControllerObservable, ApiMethod, EApiAction, EApiAuthenticationType, EApiControllerRequestTransformerType, EApiDtoType, EApiRouteType, IApiControllerBase, IApiControllerProperties, TRANSFORMER_VALUE_DTO_CONSTANT } from "@elsikora/nestjs-crud-automator";
import { Body, HttpStatus, Param, Req, RequestMethod } from "@nestjs/common";
import { plainToClass } from "class-transformer";

import ClientPublicGuard from "../../common/guard/client-public.guard";
import ClientSecretGuard from "../../common/guard/client-secret.guard";
import { IApiAuthRequestClientPublic } from "../../shared/interface/api/auth-request-client-public.interface";
import { IApiAuthRequestClientSecret } from "../../shared/interface/api/auth-request-client-secret.interface";

import { ChallengeService } from "./challenge.service";
import { ChallengeSolveRequestBodyDTO } from "./dto/solve-request-body.dto";
import { ChallengeSolveRequestParametersDTO } from "./dto/solve-request-parameters.dto";
import { ChallengeSolveResponseDTO } from "./dto/solve-response.dto";
import { ChallengeVerifyRequestBodyDTO } from "./dto/verify-request-body.dto";
import { ChallengeVerifyRequestParametersDTO } from "./dto/verify-request-parameters.dto";
import { ChallengeVerifyResponseDTO } from "./dto/verify-response.dto";
import { Challenge } from "./entity/challenge.entity";
import { IChallengeSolveResult } from "./interface/solve-result.interface";

const config: IApiControllerProperties<Challenge> = {
	entity: Challenge,
	name: "Challenge",
	path: "challenge",
	routes: {
		[EApiRouteType.CREATE]: {
			authentication: {
				bearerStrategies: ["publicAuthorization"],
				guard: ClientPublicGuard,
				type: EApiAuthenticationType.USER,
			},
			isEnabled: true,
			request: {
				transformers: {
					[EApiDtoType.BODY]: [
						{
							key: "client",
							shouldSetValueEvenIfMissing: true,
							type: EApiControllerRequestTransformerType.DYNAMIC,
							value: TRANSFORMER_VALUE_DTO_CONSTANT.AUTHORIZED_ENTITY,
						},
					],
				},
			},
		},
		[EApiRouteType.DELETE]: {
			isEnabled: false,
		},
		[EApiRouteType.GET]: {
			isEnabled: false,
		},
		[EApiRouteType.GET_LIST]: {
			isEnabled: false,
		},
		[EApiRouteType.PARTIAL_UPDATE]: {
			isEnabled: false,
		},
		[EApiRouteType.UPDATE]: {
			isEnabled: true,
			shouldWriteToController: false,
		},
	},
};

@ApiController(config)
@ApiControllerObservable()
export class ChallengeController implements IApiControllerBase<Challenge> {
	constructor(public service: ChallengeService) {}

	@ApiMethod({
		action: EApiAction.SOLVE,
		authentication: {
			bearerStrategies: ["publicAuthorization"],
			guard: ClientPublicGuard,
			type: EApiAuthenticationType.USER,
		},
		entity: Challenge,
		httpCode: HttpStatus.OK,
		method: RequestMethod.POST,
		path: ":challenge/solve",
		responses: { hasBadRequest: true, hasConflict: true, hasInternalServerError: true, hasNotFound: true, hasUnauthorized: true },
		responseType: ChallengeSolveResponseDTO,
	})
	solve(@Req() request: IApiAuthRequestClientPublic, @Param() parameters: ChallengeSolveRequestParametersDTO, @Body() body: ChallengeSolveRequestBodyDTO): Promise<ChallengeSolveResponseDTO> {
		return this.service
			.get({ where: { client: { id: request.user.id }, id: parameters.challenge } })
			.then(async (challenge: Challenge) => {
				return this.service
					.solve({ challenge, solution: body.solution })
					.then((response: IChallengeSolveResult) => {
						return plainToClass(ChallengeSolveResponseDTO, response, {
							excludeExtraneousValues: true,
						});
					})
					.catch((error: unknown) => {
						throw error;
					});
			})
			.catch((error: unknown) => {
				throw error;
			});
	}

	@ApiMethod({
		action: EApiAction.VERIFY,
		authentication: {
			bearerStrategies: ["secretAuthorization"],
			guard: ClientSecretGuard,
			type: EApiAuthenticationType.USER,
		},
		entity: Challenge,
		httpCode: HttpStatus.OK,
		method: RequestMethod.POST,
		path: ":challenge/verify",
		responses: { hasBadRequest: true, hasInternalServerError: true, hasNotFound: true, hasUnauthorized: true },
		responseType: ChallengeVerifyResponseDTO,
	})
	verify(@Req() request: IApiAuthRequestClientSecret, @Param() parameters: ChallengeVerifyRequestParametersDTO, @Body() body: ChallengeVerifyRequestBodyDTO): Promise<ChallengeVerifyResponseDTO> {
		return this.service
			.get({ where: { client: { id: request.user.id }, id: parameters.challenge, token: body.token } })
			.then((challenge: Challenge) => {
				return plainToClass(ChallengeVerifyResponseDTO, this.service.verify({ challenge }), {
					excludeExtraneousValues: true,
				});
			})
			.catch((error: unknown) => {
				throw error;
			});
	}
}
