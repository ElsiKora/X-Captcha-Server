import type { EntityManager } from "typeorm/entity-manager/EntityManager";

import type { Challenge } from "../entity/challenge.entity";

export default class ChallengeEventBeforeInsert {
	eventManager!: EntityManager;

	item!: Challenge;
}
