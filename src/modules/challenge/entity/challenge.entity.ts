/* eslint-disable @elsikora/typescript/naming-convention */
import { ApiPropertyDescribe, EApiDtoType, EApiPropertyDateIdentifier, EApiPropertyDateType, EApiPropertyDescribeType, EApiRouteType } from "@elsikora/nestjs-crud-automator";
import { Column, CreateDateColumn, Entity, Generated, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { ECaptchaType } from "../../../shared/enum/captcha-type.enum";
import { Client } from "../../client/entity/client.entity";
import { ChallengeDataClickDynamicDto } from "../dynamic-dto/data-click.dynamic-dto";
import { ChallengeDataPowDynamicDto } from "../dynamic-dto/data-pow.dynamic-dto";
import { ChallengeSolutionClickDynamicDto } from "../dynamic-dto/solution-click.dynamic-dto";
import { ChallengeSolutionPowDynamicDto } from "../dynamic-dto/solution-pow.dynamic-dto";
import { IChallengeDataClick } from "../interface/data-click.interface";
import { IChallengeDataPow } from "../interface/data-pow.interface";
import { IChallengeSolutionClick } from "../interface/solution-click.interface";
import { IChallengeSolutionPow } from "../interface/solution-pow.interface";

@Entity()
export class Challenge {
	@ApiPropertyDescribe({
		description: "client",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
				[EApiDtoType.RESPONSE]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		type: EApiPropertyDescribeType.RELATION,
	})
	@Index()
	@JoinColumn()
	@ManyToOne(() => Client, {
		eager: false,
		nullable: false,
		onDelete: "CASCADE",
	})
	client!: Client;

	@ApiPropertyDescribe({
		format: EApiPropertyDateType.DATE_TIME,
		identifier: EApiPropertyDateIdentifier.CREATED_AT,
		type: EApiPropertyDescribeType.DATE,
	})
	@CreateDateColumn({ default: () => "CURRENT_TIMESTAMP", nullable: false, type: "timestamp" })
	createdAt!: Date;

	@ApiPropertyDescribe({
		dataType: { [ECaptchaType.CLICK]: ChallengeDataClickDynamicDto, [ECaptchaType.POW]: ChallengeDataPowDynamicDto },
		description: "data",
		discriminator: {
			mapping: {
				[ECaptchaType.CLICK]: ECaptchaType.CLICK,
				[ECaptchaType.POW]: ECaptchaType.POW,
			},
			propertyName: "type",
			shouldKeepDiscriminatorProperty: true,
		},
		isDynamicallyGenerated: true,
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		shouldValidateNested: true,
		type: EApiPropertyDescribeType.OBJECT,
	})
	@Column({ default: {}, nullable: false, type: "jsonb" })
	data!: IChallengeDataClick | IChallengeDataPow;

	@ApiPropertyDescribe({
		type: EApiPropertyDescribeType.UUID,
	})
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@ApiPropertyDescribe({
		description: "solved state",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
				[EApiDtoType.RESPONSE]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		type: EApiPropertyDescribeType.BOOLEAN,
	})
	@Column({ default: false, nullable: false })
	isSolved!: boolean;

	@ApiPropertyDescribe({
		dataType: { [ECaptchaType.CLICK]: ChallengeSolutionClickDynamicDto, [ECaptchaType.POW]: ChallengeSolutionPowDynamicDto },
		description: "solution",
		discriminator: {
			mapping: {
				[ECaptchaType.CLICK]: ECaptchaType.CLICK,
				[ECaptchaType.POW]: ECaptchaType.POW,
			},
			propertyName: "type",
			shouldKeepDiscriminatorProperty: true,
		},
		isDynamicallyGenerated: true,
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
				[EApiDtoType.RESPONSE]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		shouldValidateNested: true,
		type: EApiPropertyDescribeType.OBJECT,
	})
	@Column({ default: {}, nullable: false, type: "jsonb" })
	solution!: IChallengeSolutionClick | IChallengeSolutionPow;

	@ApiPropertyDescribe({
		description: "solution token",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
				[EApiDtoType.RESPONSE]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		type: EApiPropertyDescribeType.UUID,
	})
	@Column({ nullable: false })
	@Generated("uuid")
	@Index()
	token!: string;

	@ApiPropertyDescribe({
		description: "type",
		enum: ECaptchaType,
		enumName: "ECaptchaType",
		type: EApiPropertyDescribeType.ENUM,
	})
	@Column({
		default: ECaptchaType.CLICK,
		enum: ECaptchaType,
		nullable: false,
		type: "enum",
	})
	type!: ECaptchaType;

	@ApiPropertyDescribe({
		format: EApiPropertyDateType.DATE_TIME,
		identifier: EApiPropertyDateIdentifier.UPDATED_AT,
		type: EApiPropertyDescribeType.DATE,
	})
	@UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP", nullable: false, type: "timestamp" })
	updatedAt!: Date;
}
