import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	CreateDateColumn,
	OneToMany,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
@Entity('product_photos')
export class ProductPhoto {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100 })
	url: string;

	@CreateDateColumn()
	createdAt: Date;

	@Column()
	productId: string; // ahora puedes asignar directamente desde el DTO

	@ManyToOne(() => Product, (product) => product.productPhotos, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' }) // asegura el nombre de la FK
	product: Product;
}
