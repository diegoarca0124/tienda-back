import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany, Generated } from 'typeorm';
import { Subcategory } from './subcategory.entity';
import { AttributeCategory } from './attribute-category.entity';
import { Product } from './product.entity';
import { ProductGroup } from './product-group.entity';

@Entity('categories')
export class Category {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', unique: true })
	prefix: string;

	@Column({
		type: 'bigint',
		unique: true,
	})
	@Generated('increment')
	code: string;

	@Column({ type: 'varchar', length: 100 })
	name: string;

	@Column({ type: 'varchar', length: 500 })
	slug: string;

	@Column({ type: 'varchar', length: 2000, nullable: true })
	icon: string;

	@Column({ type: 'varchar', length: 2000 })
	description: string;

	@Column({ type: 'boolean', default: false })
	isDimensions: boolean;

	@Column({ type: 'boolean', default: false })
	isCharacteristics: boolean;

	@Column({ type: 'boolean', default: false })
	isCondition: boolean;

	@Column({ type: 'boolean', default: false })
	isWarranty: boolean;

	@Column({ type: 'boolean', default: false })
	isCountryOfOrigin: boolean;

	@Column({ type: 'boolean', default: false })
	isMaterial: boolean;

	@Column({ type: 'boolean', default: false })
	isTemperature: boolean;

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

	@OneToMany(() => ProductGroup, (productGroup) => productGroup.category)
	productGroups: ProductGroup[];

	@OneToMany(() => Product, (product) => product.category)
	products: Product[];

	@OneToMany(() => AttributeCategory, (attributeCategory) => attributeCategory.category)
	attributeCategories: AttributeCategory[];
}
