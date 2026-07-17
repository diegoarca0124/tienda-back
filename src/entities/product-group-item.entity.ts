import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { ProductGroup } from './product-group.entity';

@Entity('product_group_items')
export class ProductGroupItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	productGroupId: string;

	@ManyToOne(() => ProductGroup, (productGroup) => productGroup.productGroupItems, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productGroupId' })
	productGroup: ProductGroup;

	@ManyToOne(() => Product, (product) => product.productGroupItems, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' })
	product: Product;

	@Column()
	productId: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
