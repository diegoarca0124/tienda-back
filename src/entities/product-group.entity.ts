import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne, OneToMany, Generated } from 'typeorm';
import { Product } from './product.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { ProductGroupItem } from './product-group-item.entity';

@Entity('product_groups')
export class ProductGroup {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		type: 'bigint',
		unique: true,
	})
	@Generated('increment')
	code: string;

	@OneToMany(() => ProductGroupItem, (productGroupItem) => productGroupItem.productGroup)
	productGroupItems: ProductGroupItem[];

	@Column()
	categoryId: string;

	@ManyToOne(() => Category, (category) => category.productGroups, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: Category;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
