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
@Entity('subcategories')
export class ProductPhisycal {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	weight?: number; // Peso del producto

	@Column({ type: 'varchar', length: 20, default: 'kg' })
	weightUnit: string; // kg, g, lb, etc.

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	height?: number; // Alto del producto

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	width?: number; // Ancho del producto

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	length?: number; // Largo del producto

	@Column({ type: 'varchar', length: 20, default: 'cm' })
	dimensionUnit: string; // cm, in, mm, etc.

	@Column({ type: 'boolean', default: false })
	isFragile: boolean;

	@Column({ type: 'varchar', length: 50, nullable: true })
	material?: string; //  Material del producto

	@CreateDateColumn()
	createdAt: Date;

	@Column()
	productId: string; // ahora puedes asignar directamente desde el DTO

	@ManyToOne(() => Product, (product) => product.productPhotos, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' }) // asegura el nombre de la FK
	product: Product;
}
