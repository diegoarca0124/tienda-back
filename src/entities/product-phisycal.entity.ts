import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	CreateDateColumn,
	OneToMany,
	ManyToOne,
	JoinColumn,
	OneToOne,
} from 'typeorm';
import { Product } from './product.entity';
@Entity('product_physicals')
export class ProductPhisycal {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	weight?: number; // Peso del producto

	@Column({ type: 'jsonb', nullable: true })
	weightUnit: { group: string; name: string; abbr: string };

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	height?: number; // Alto del producto

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	width?: number; // Ancho del producto

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	length?: number; // Largo del producto

	@Column({ type: 'jsonb', nullable: true })
	dimensionUnit: { group: string; name: string; abbr: string };

	@Column({ type: 'boolean', default: false })
	isFragile: boolean; //Es Fragil?

	@Column({ type: 'boolean', default: false })
	isPerishable: boolean; // Indica si el producto se deteriora con el tiempo

	@Column({ type: 'boolean', default: false })
	isEcoFriendly: boolean; // Si es reciclable o ecológico

	@Column({ type: 'boolean', default: false })
	isBiodegradable: boolean;

	@Column({ type: 'boolean', default: false })
	isHazardous: boolean; // Material peligroso (para envíos regulados)

	@Column({ type: 'boolean', default: false })
	isRequiresRefrigeration: boolean;

	@Column({ type: 'boolean', default: false })
	isFlammable: boolean; //Es flamable

	@Column({ type: 'boolean', default: false })
	isRequiresAssembly: boolean; // Si el producto necesita ser ensamblado

	@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
	minStorageTemp?: number;

	@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
	maxStorageTemp?: number;

	@Column({ type: 'jsonb', nullable: true })
	storageTempUnit: { name: string; abbr: string };

	@Column({ type: 'varchar', length: 50, nullable: true })
	material?: string; //  Material del producto

	@CreateDateColumn()
	createdAt: Date;

	@Column()
	productId: string; // ahora puedes asignar directamente desde el DTO

	@OneToOne(() => Product, (product) => product.productPhisycal, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' }) // asegura el nombre de la FK
	product: Product;
}
