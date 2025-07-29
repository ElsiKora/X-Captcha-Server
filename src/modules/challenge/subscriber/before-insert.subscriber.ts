import type { EntitySubscriberInterface, InsertEvent } from "typeorm";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DataSource, EventSubscriber } from "typeorm";

import { Challenge } from "../entity/challenge.entity";
import ChallengeEventBeforeInsert from "../event/before-insert.event";

@EventSubscriber()
export default class ChallengeBeforeInsertSubscriber implements EntitySubscriberInterface<Challenge> {
	constructor(
		private readonly eventEmitter: EventEmitter2,
		@Inject(DataSource) readonly connection: DataSource,
	) {
		connection.subscribers.push(this);
	}

	beforeInsert(event: InsertEvent<Challenge>): Promise<boolean> {
		const challenge: Challenge = event.entity;

		const payload: ChallengeEventBeforeInsert = new ChallengeEventBeforeInsert();
		payload.item = challenge;
		payload.eventManager = event.manager;

		return this.eventEmitter
			.emitAsync("challenge.beforeInsert", payload)
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
