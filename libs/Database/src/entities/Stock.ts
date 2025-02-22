import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm"

@Entity()
export class Stock extends BaseEntity {
	
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	symbol: string

	@Column()
	exchange: string

	@Column()
	companyName: string

	@Column()
	exDate: Date

	@Column()
	annData: Date

	@Column()
	splitRatio: string

	@Column("int")
	splitNumerator: number

	@Column("int")
	splitDenominator: number

	@Column("decimal")
	ratioDecimal: number
}
