import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	OneToMany,
	OneToOne,
} from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { ProductPhoto } from './product-photo.entity';
import { ProductSeo } from './product-seo.entity';
import { ProductPhisycal } from './product-phisycal.entity';
import { ProductShipping } from './product-shipping.entity';
import { ProductVariant } from './product-variants.entity';
import { ProductGroupItem } from './product-group-item.entity';

@Entity({ name: 'products' })
export class Product {
	// 🆔 Identificador único
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar' })
	status: string; // Ejemplo: true = activo, false = inactivo

	@Column({ type: 'varchar' }) // public | private
	visibility: string; // Ejemplo: "public" o "private"

	// 🏷️ Información general
	@Column({ type: 'varchar', length: 250 })
	name: string; // Ejemplo: "Smart TV Samsung 55 pulgadas"

	@Column({ type: 'varchar', length: 100 })
	type: string; // Ejemplo: "Físico", "Digital" o "Servicio"

	@Column({ type: 'varchar', length: 500 })
	slug: string; // Ejemplo: "smart-tv-samsung-55"

	@Column({ type: 'varchar' })
	description: string; // Descripción detallada del producto

	@Column({ type: 'varchar' })
	extract: string; // Resumen corto para vista previa o listado

	@Column({ type: 'varchar' })
	cover: string; // Imagen principal o portada del producto

	@Column({ type: 'varchar' })
	miniature: string;
	
	@Column({ type: 'jsonb', nullable: true })
	unitOfMeasure: { group: string; name: string; abbr: string };

	@Column({ type: 'varchar', length: 100, nullable: true })
	condition: string; // Ejemplo: "Nuevo", "Usado", "Reacondicionado"

	@Column({ type: 'varchar', length: 100, nullable: true })
	warranty: string; // Ejemplo: "1 año de garantía"

	@Column({ type: 'jsonb', nullable: true })
	countryOfOrigin: { code: string; flag: string; name: string };

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	priceRegular: number; // Precio normal (ej: 299.99)

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	priceDiscount: number; // Precio con descuento (ej: 249.99)

	@Column({ type: 'simple-array', nullable: true })
	tags?: string[]; // Palabras clave, ej: ["oferta", "verano", "nuevo"]

	@Column()
	brandId: string;

	@Column()
	categoryId: string;

	@Column()
	subcategoryId: string;

	@Column({ type: 'int', nullable: true, default: 0 })
	stockQuantity: number; // Stock total disponible (ej: 25 unidades)

	// ⭐ Calificaciones y reseñas
	@Column({ type: 'int', default: 0 })
	reviewsCount: number; // Ejemplo: 120 reseñas

	@Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
	averageRating: number; // Ejemplo: 4.7 de 5 estrellas

	@Column({ type: 'int', default: 0 })
	viewsCount: number; // Número de veces que se ha visto el producto

	@Column({ type: 'int', default: 0 })
	salesCount: number; // Número de veces que se ha vendido el producto

	// 📊 Estado comercial / marketing
	@Column({ type: 'boolean', default: false })
	isBestSeller: boolean; // Ejemplo: producto con más ventas

	@Column({ type: 'boolean', default: false })
	isNewArrival: boolean; // Ejemplo: recién agregado al catálogo

	@Column({ type: 'boolean', default: false })
	isFeatured: boolean; // Ejemplo: destacado en página principal

	@Column({ type: 'boolean', default: false })
	isLimitedEdition: boolean;

	@Column({ type: 'boolean', default: false })
	isPreOrder: boolean; // Indica si está disponible para preventa

	@Column({ type: 'boolean', default: false })
	isExportable: boolean; // Ejemplo: disponible para venta internacional

	@Column({ type: 'boolean', default: false })
	allowBackorder: boolean; // Permite comprar aunque no haya stock

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

	@OneToMany(() => ProductGroupItem, (productGroupItem) => productGroupItem.product)
	productGroupItems: ProductGroupItem[];

	@Column({ nullable: true })
	statusAt: Date; // Fecha en que cambió el estado

	@CreateDateColumn()
	createdAt: Date; // Fecha de creación

	@UpdateDateColumn()
	updatedAt: Date; // Fecha de última actualización
}
