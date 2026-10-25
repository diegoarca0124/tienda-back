import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Category } from './category.entity';
import { Attribute } from './attribute.entity';
import { ProductDescription } from './product-description.entity';

@Entity('attribute_values')
@Index('UQ_ATTRIBUTE_VALUES_NORMALIZED', { synchronize: false })
export class AttributeValue {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 150 })
	value: string;

	@Column({ type: 'boolean', default: false })
	status: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@ManyToOne(() => Attribute, (attribute) => attribute.attributeValues, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'attributeId' })
	attribute: Attribute;

	@Column()
	attributeId: string;

	@OneToMany(() => ProductDescription, (productDescription) => productDescription.attributeValue)
	productDescriptions: ProductDescription[];
}
