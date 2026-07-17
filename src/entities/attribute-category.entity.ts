import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Column, JoinColumn } from 'typeorm';
import { Attribute } from './attribute.entity';
import { Category } from './category.entity';
import { AttributeGroup } from './attribute-group.entity';

@Entity('attribute_categories')
export class AttributeCategory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => AttributeGroup, (attributeGroup) => attributeGroup.attributeCategories, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'attributeGroupId' })
	attributeGroup: AttributeGroup;

	@Column()
	attributeGroupId: string;

	@ManyToOne(() => Category, (category) => category.attributeCategories, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: Category;

	@Column()
	categoryId: string;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;
}
