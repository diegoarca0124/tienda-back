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

@Entity({ name: 'products' })
export class Product {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 250 })
	name: string;

	@Column({ type: 'varchar', length: 100 })
	type: string; //Fisico  | Digital | Servicio

	@Column({ type: 'varchar', length: 500 })
	slug: string;

	@Column({ type: 'varchar' })
	description: string;

	@Column({ type: 'varchar' })
	cover: string;

	@Column({ type: 'simple-array', nullable: true })
	tags?: string[]; //SEO

	@Column({ type: 'simple-array', nullable: true })
	labels?: string[]; //Nuevo, Oferta, Cyber, Sale

	@Column({ type: 'decimal', precision: 10, scale: 2 })
	priceRegular: number;

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	priceDiscount: number;

	@Column()
	brandId: string;

	@Column()
	categoryId: string;

	@Column()
	subcategoryId: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	countryOfOrigin?: string;

	@Column({ type: 'boolean' })
	status: boolean;

	@Column({ type: 'varchar' }) // public | private
	visibility: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'brandId' })
	brand: Brand;

	@ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: Category;

	@ManyToOne(() => Subcategory, (subcategory) => subcategory.products, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'subcategoryId' })
	subcategory: Subcategory;

	@OneToMany(() => ProductPhoto, (productPhoto) => productPhoto.product)
	productPhotos: ProductPhoto[];

	@OneToOne(() => ProductSeo, (productSeo) => productSeo.product, { cascade: true })
	productSeo: ProductSeo;

	@OneToOne(() => ProductShipping, (productShipping) => productShipping.product, { cascade: true })
	productShipping: ProductShipping;

	@OneToOne(() => ProductPhisycal, (productPhisycal) => productPhisycal.product, { cascade: true })
	productPhisycal: ProductPhisycal;
}
