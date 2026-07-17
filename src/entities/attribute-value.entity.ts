import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { Attribute } from './attribute.entity';
import { ProductDescription } from './product-description.entity';

@Entity('attribute_values')
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
