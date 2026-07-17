import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Attribute } from './attribute.entity';
import { AttributeCategory } from './attribute-category.entity';

@Entity('attribute_groups')
export class AttributeGroup {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true, length: 150 })
	name: string;

	@Column({ type: 'varchar', length: 250 })
	description: string;

	@Column({ default: false })
	status: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@OneToMany(() => Attribute, (attribute) => attribute.attributeGroup)
	attributes: Attribute[];

	@OneToMany(() => AttributeCategory, (attributeCategory) => attributeCategory.attributeGroup)
	attributeCategories: AttributeCategory[];
}
