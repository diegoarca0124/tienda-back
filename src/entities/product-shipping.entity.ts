import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_shippings')
export class ProductShipping {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'boolean', default: false })
	freeShipping: boolean;

	@Column({ type: 'int', default: 0 })
	handlingDays: number; // Días de preparación antes de enviar

	@Column({ type: 'varchar', length: 50, nullable: true })
	packageType: string; // ejemplo: "caja", "sobre", "tubo", "palet"

	@Column({ type: 'boolean', default: false })
	pickupInStore: boolean; // Permite recojo en tienda

	@Column({ type: 'text', nullable: true })
	specialInstructions: string; // Instrucciones de envio

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
