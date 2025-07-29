import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { IEventEmitterResponse } from "../../../shared/interface/event-emitter-response.interface";
import { ChallengeService } from "../challenge.service";
import ChallengeEventAfterInsert from "../event/after-insert.event";

@Injectable()
export class ChallengeAfterInsertListener {
	constructor(private readonly service: ChallengeService) {}

	@OnEvent("challenge.afterInsert")
	async handleChallengeAfterInsert(event: ChallengeEventAfterInsert): Promise<IEventEmitterResponse> {
		try {
			await this.service.setUpChallenge(event.item, event.eventManager);

			return { isSuccess: true };
		} catch (error: unknown) {
			return { error, isSuccess: false };
		}
	}
}
