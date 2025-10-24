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

@Entity('product_seo')
export class ProductSeo {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	// === DATOS BÁSICOS DE SEO ===
	@Column({ type: 'varchar', length: 160, nullable: true })
	metaTitle?: string; // Título SEO (máx. ~60-70 caracteres)

	@Column({ type: 'varchar', length: 255, nullable: true })
	metaDescription?: string; // Descripción SEO (máx. ~155 caracteres)

	@Column({ type: 'varchar', length: 255, nullable: true })
	metaKeywords?: string; // Palabras clave separadas por coma

	// === DATOS PARA REDES SOCIALES ===
	@Column({ type: 'varchar', length: 255, nullable: true })
	ogTitle?: string; // Título para Open Graph (Facebook, LinkedIn)

	@Column({ type: 'varchar', length: 255, nullable: true })
	ogDescription?: string; // Descripción para Open Graph

	@Column({ type: 'varchar', length: 255, nullable: true })
	ogImage?: string; // Imagen para compartir (URL completa o relativa)

	@Column({ type: 'varchar', length: 100, nullable: true })
	twitterCardType?: string; // Ej. "summary_large_image"

	// === INDEXACIÓN Y VISIBILIDAD ===
	@Column({ type: 'boolean', default: true })
	isIndexable: boolean; // Si el producto debe indexarse en buscadores

	@Column({ type: 'jsonb', nullable: true })
	structuredData?: Record<string, any>; 
	// JSON para schema.org (rich snippets)

	// === RELACIONES ===
	@Column()
	productId: string;

	@OneToOne(() => Product, (product) => product.productSeo, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' })
	product: Product;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
