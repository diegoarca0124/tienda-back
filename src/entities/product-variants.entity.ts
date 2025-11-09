import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity('product_variants')
export class ProductVariant {
	@PrimaryGeneratedColumn('uuid')
	id: string;
    
	@ManyToOne(() => Product, (product) => product.productVariants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' }) // asegura el nombre de la FK
    product: Product;

    @Column()
	productId: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
