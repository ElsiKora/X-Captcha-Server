import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChallengeController } from "./challenge.controller";
import ChallengeService from "./challenge.service";
import { Challenge } from "./entity/challenge.entity";

@Module({
	controllers: [ChallengeController],
	exports: [ChallengeService],
	imports: [TypeOrmModule.forFeature([Challenge])],
	providers: [ChallengeService],
})
export class ChallengeModule {}
