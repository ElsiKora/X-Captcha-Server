/* eslint-disable @elsikora/typescript/no-magic-numbers,@elsikora/typescript/naming-convention */
import { ApiPropertyDescribe, EApiDtoType, EApiPropertyDateIdentifier, EApiPropertyDateType, EApiPropertyDescribeType, EApiPropertyStringType, EApiRouteType } from "@elsikora/nestjs-crud-automator";
import { Column, CreateDateColumn, Entity, Generated, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { Challenge } from "../../challenge/entity/challenge.entity";

@Entity()
export class Client {
	@OneToMany(() => Challenge, (entity: Challenge) => entity.client)
	challenges!: Array<Challenge>;

	@ApiPropertyDescribe({
		format: EApiPropertyDateType.DATE_TIME,
		identifier: EApiPropertyDateIdentifier.CREATED_AT,
		type: EApiPropertyDescribeType.DATE,
	})
	@CreateDateColumn({ default: () => "CURRENT_TIMESTAMP", nullable: false, type: "timestamp" })
	createdAt!: Date;

	@ApiPropertyDescribe({
		type: EApiPropertyDescribeType.UUID,
	})
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@ApiPropertyDescribe({
		description: "activity status",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		type: EApiPropertyDescribeType.BOOLEAN,
	})
	@Column({ default: true, nullable: false })
	isActive!: boolean;

	@ApiPropertyDescribe({
		description: "name",
		exampleValue: "Client",
		format: EApiPropertyStringType.STRING,
		maxLength: 64,
		minLength: 3,
		pattern: "/.{3,64}/",
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: 64, nullable: false, type: "varchar" })
	name!: string;

	@ApiPropertyDescribe({
		description: "public key",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		type: EApiPropertyDescribeType.UUID,
	})
	@Column({ nullable: false, unique: true })
	@Generated("uuid")
	@Index()
	publicKey!: string;

	@ApiPropertyDescribe({
		description: "secret key",
		properties: {
			[EApiRouteType.CREATE]: {
				[EApiDtoType.BODY]: {
					isEnabled: false,
					isRequired: false,
				},
			},
		},
		type: EApiPropertyDescribeType.UUID,
	})
	@Column({ nullable: false, unique: true })
	@Generated("uuid")
	secretKey!: string;

	@ApiPropertyDescribe({
		format: EApiPropertyDateType.DATE_TIME,
		identifier: EApiPropertyDateIdentifier.UPDATED_AT,
		type: EApiPropertyDescribeType.DATE,
	})
	@UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP", nullable: false, type: "timestamp" })
	updatedAt!: Date;
}
