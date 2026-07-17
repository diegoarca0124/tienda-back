import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne, Generated } from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { ProductPhoto } from './product-photo.entity';
import { ProductSeo } from './product-seo.entity';
import { ProductPhisycal } from './product-phisycal.entity';
import { ProductShipping } from './product-shipping.entity';
import { ProductVariant } from './product-variants.entity';
import { ProductGroupItem } from './product-group-item.entity';
import { ProductDescription } from './product-description.entity';

@Entity({ name: 'products' })
export class Product {
	// =====================================================
	// 🆔 IDENTIFICACIÓN
	// =====================================================
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 250 })
	name: string;

	@Column({ type: 'varchar', length: 500 })
	slug: string;

	@Column({ type: 'varchar', length: 100 })
	type: string;

	@Column({
		type: 'bigint',
		unique: true,
	})
	@Generated('increment')
	code: string;

	@Column({
		type: 'smallint',
		default: 0,
	})
	quality: number;

	// =====================================================
	// 📌 ESTADO / VISIBILIDAD
	// =====================================================
	@Column({ type: 'varchar' })
	status: string; // active | inactive | draft

	@Column({ type: 'varchar' })
	visibility: string; // public | private

	@Column({ nullable: true })
	statusAt: Date;

	// =====================================================
	// 📝 CONTENIDO
	// =====================================================
	@Column({ type: 'varchar' })
	description: string;

	@Column({ type: 'varchar' })
	extract: string;

	// =====================================================
	// 🖼️ MEDIA
	// =====================================================
	@Column({ type: 'varchar' })
	cover: string;

	@Column({ type: 'varchar' })
	miniature: string;

	// =====================================================
	// 🏷️ CATEGORIZACIÓN
	// =====================================================
	@Column()
	brandId: string;

	@Column()
	categoryId: string;

	@Column()
	subcategoryId: string;

	@Column({ type: 'simple-array', nullable: true })
	tags?: string[];

	// =====================================================
	// 🌍 INFORMACIÓN GENERAL
	// =====================================================
	@Column({ type: 'jsonb', nullable: true })
	unitOfMeasure: { group: string; name: string; abbr: string };

	@Column({ type: 'varchar', length: 100, nullable: true })
	condition: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	warranty: string;

	@Column({ type: 'jsonb', nullable: true })
	countryOfOrigin: { code: string; flag: string; name: string };

	// =====================================================
	// 💰 PRECIOS
	// =====================================================
	@Column({ type: 'decimal', precision: 10, scale: 2 })
	priceRegular: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	priceDiscount: number;

	// =====================================================
	// 📦 INVENTARIO
	// =====================================================
	@Column({ type: 'int', nullable: true, default: 0 })
	stockQuantity: number;

	@Column({ type: 'int', nullable: true })
	minStock: number;

	@Column({ type: 'int', nullable: true })
	maxStock: number;

	@Column({ type: 'int', nullable: true })
	maxOrderLimit: number;

	@Column({ type: 'boolean', default: false })
	allowBackorder: boolean;

	// =====================================================
	// 📈 MÉTRICAS
	// =====================================================
	@Column({ type: 'int', default: 0 })
	reviewsCount: number;

	@Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
	averageRating: number;

	@Column({ type: 'int', default: 0 })
	viewsCount: number;

	@Column({ type: 'int', default: 0 })
	salesCount: number;

	// =====================================================
	// 🚀 MARKETING
	// =====================================================
	@Column({ type: 'boolean', default: false })
	isBestSeller: boolean;

	@Column({ type: 'boolean', default: false })
	isNewArrival: boolean;

	@Column({ type: 'boolean', default: false })
	isFeatured: boolean;

	@Column({ type: 'boolean', default: false })
	isLimitedEdition: boolean;

	@Column({ type: 'boolean', default: false })
	isPreOrder: boolean;

	@Column({ type: 'boolean', default: false })
	isExportable: boolean;

	// =====================================================
	// 🔗 RELACIONES
	// =====================================================
	@ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: Category;

	@ManyToOne(() => Subcategory, (subcategory) => subcategory.products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'subcategoryId' })
	subcategory: Subcategory;

	@OneToMany(() => ProductPhoto, (photo) => photo.product)
	productPhotos: ProductPhoto[];

	@OneToOne(() => ProductSeo, (seo) => seo.product, { cascade: true })
	productSeo: ProductSeo;

	@OneToOne(() => ProductShipping, (shipping) => shipping.product, { cascade: true })
	productShipping: ProductShipping;

	@OneToOne(() => ProductPhisycal, (physical) => physical.product, { cascade: true })
	productPhisycal: ProductPhisycal;

	@OneToMany(() => ProductVariant, (variant) => variant.product)
	productVariants: ProductVariant[];

	@OneToMany(() => ProductGroupItem, (item) => item.product)
	productGroupItems: ProductGroupItem[];

	@OneToMany(() => ProductDescription, (description) => description.product)
	productDescriptions: ProductDescription[];

	// =====================================================
	// 🕒 FECHAS
	// =====================================================
	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
