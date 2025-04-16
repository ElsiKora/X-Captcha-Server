import type { Challenge } from "../entity/challenge.entity";

import { ApiFunctionSubscriberBase } from "@elsikora/nestjs-crud-automator";

export class TestSubscriber extends ApiFunctionSubscriberBase<Challenge> {
	async after() {
		console.log("TestSubscriber.after");
	}

	async before() {
		console.log("TestSubscriber.before");
	}

	async onError() {
		console.log("TestSubscriber.onError");
	}
}
