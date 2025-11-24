import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Subcategory } from './subcategory.entity';
import { AttributeCategory } from './attribute-category.entity';

@Entity('categories')
export class Category {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100 })
	name: string;

	@Column({ type: 'varchar', length: 500 })
	slug: string;

	@Column({ type: 'varchar', length: 2000 })
	icon: string;

	@Column({ type: 'varchar', length: 2000 })
	description: string;

	@Column({ type: 'boolean', default: false })
	status: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(() => Subcategory, (subcategory) => subcategory.category)
	subcategories: Subcategory[];

	/* @OneToMany(() => Product, (product) => product.category)
	products: Product[];
 */
	@OneToMany(() => AttributeCategory, (attributeCategory) => attributeCategory.category)
	attributeCategories: AttributeCategory[];
}
