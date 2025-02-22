import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm"
import { Stock } from "./Stock"

@Entity()
export class SplitAction {

	@PrimaryGeneratedColumn()
	id: number

	@OneToOne(() => Stock)
	@JoinColumn()
	stock: Stock

	@Column("bit", { nullable: true })
	posted: boolean

	@Column("enum", { enum: ['ROUND_UP', 'ROUND_DOWN', 'CASH', 'UNKNOWN'], nullable: true})
	splitAction: string

	@Column("varchar", { length: 50, nullable: true })
	discordMessage: string
}
