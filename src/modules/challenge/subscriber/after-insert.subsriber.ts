import type { EntitySubscriberInterface, InsertEvent } from "typeorm";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DataSource, EventSubscriber } from "typeorm";

import ChallengeService from "../challenge.service";
import { Challenge } from "../entity/challenge.entity";
import ChallengeEventAfterInsert from "../event/after-insert.event";

@EventSubscriber()
export default class ChallengeAfterInsertSubscriber implements EntitySubscriberInterface<Challenge> {
	constructor(
		private readonly eventEmitter: EventEmitter2,
		@Inject(DataSource) readonly connection: DataSource,
		private readonly service: ChallengeService,
	) {
		connection.subscribers.push(this);
	}

	afterInsert(event: InsertEvent<Challenge>): Promise<boolean> {
		const challenge: Challenge = event.entity;

		const payload: ChallengeEventAfterInsert = new ChallengeEventAfterInsert();
		payload.item = challenge;
		payload.eventManager = event.manager;

		return this.eventEmitter
			.emitAsync("challenge.afterInsert", payload)
			.then((result: Array<{ error?: unknown; isSuccess: boolean }>) => {
				if (result.every((item: { error?: unknown; isSuccess: boolean }) => item.isSuccess)) {
					return true;
				} else {
					const error: unknown = result.find((item: { error?: unknown; isSuccess: boolean }) => !item.isSuccess)?.error;

					if (error instanceof HttpException) {
						throw error;
					}

					throw new InternalServerErrorException(
						ErrorString({
							entity: Challenge,
							type: EErrorStringAction.CREATING_ERROR,
						}),
					);
				}
			})
			.catch((error: unknown) => {
				throw error;
			});
	}

	listenTo(): typeof Challenge {
		return Challenge;
	}
}
