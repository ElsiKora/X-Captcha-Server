import { EErrorStringCompositeAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { IEventEmitterResponse } from "../../../shared/interface/event-emitter-response.interface";
import ClientService from "../../client/client.service";
import { ChallengeService } from "../challenge.service";
import { Challenge } from "../entity/challenge.entity";
import ChallengeEventBeforeInsert from "../event/before-insert.event";

@Injectable()
export class ChallengeBeforeInsertListener {
	constructor(
		private readonly service: ChallengeService,
		private readonly clientService: ClientService,
	) {}

	@OnEvent("challenge.beforeInsert")
	handleChallengeBeforeInsert(event: ChallengeEventBeforeInsert): IEventEmitterResponse {
		if (!this.clientService.hasChallengeType(event.item.client, event.item.type)) {
			return { error: new ForbiddenException(ErrorString({ entity: Challenge, property: "TYPE", type: EErrorStringCompositeAction.FORBIDDEN })), isSuccess: false };
		}

		return { isSuccess: true };
	}
}
