import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	OneToOne,
	JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_shippings')
export class ProductShipping {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'boolean', default: false })
	freeShipping: boolean;

	// === RELACIONES ===
	@Column()
	productId: string;

	@OneToOne(() => Product, (product) => product.productShipping, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' })
	product: Product;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
