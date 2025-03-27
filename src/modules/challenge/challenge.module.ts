import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ClientModule } from "../client/client.module";

import { ChallengeController } from "./challenge.controller";
import ChallengeService from "./challenge.service";
import { Challenge } from "./entity/challenge.entity";
import { ChallengeAfterInsertListener } from "./listener/after-insert.listener";
import { ChallengeBeforeInsertListener } from "./listener/before-insert.listener";
import ChallengeAfterInsertSubscriber from "./subscriber/after-insert.subsriber";
import ChallengeBeforeInsertSubscriber from "./subscriber/before-insert.subscriber";
@Module({
	controllers: [ChallengeController],
	exports: [ChallengeService],
	imports: [ClientModule, TypeOrmModule.forFeature([Challenge])],
	providers: [ChallengeAfterInsertListener, ChallengeAfterInsertSubscriber, ChallengeBeforeInsertListener, ChallengeBeforeInsertSubscriber, ChallengeService],
})
export class ChallengeModule {}
