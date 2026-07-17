import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AttributeCategory } from './attribute-category.entity';
import { AttributeValue } from './attribute-value.entity';
import { ProductDescription } from './product-description.entity';
import { AttributeGroup } from './attribute-group.entity';

@Entity('attributes')
export class Attribute {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 150 })
	name: string;

	@Column({ type: 'varchar', length: 250, nullable: true })
	description: string;

	@Column({ nullable: true })
	attributeGroupId: string;

	@Column({ type: 'text', nullable: true })
	unit: string;

	@Column({ type: 'boolean', default: false })
	status: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(() => AttributeValue, (attributeValue) => attributeValue.attribute)
	attributeValues: AttributeValue[];

	@OneToMany(() => ProductDescription, (productDescription) => productDescription.attribute)
	productDescriptions: ProductDescription[];

	@ManyToOne(() => AttributeGroup, (attributeGroup) => attributeGroup.attributes)
	@JoinColumn({ name: 'attributeGroupId' })
	attributeGroup: AttributeGroup;
}
