import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Attribute } from './attribute.entity';
import { AttributeValue } from './attribute-value.entity';
@Entity('product_descriptions')
export class ProductDescription {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	attributeId: string;

	@Column()
	attributeValueId: string;

	@Column({ type: 'varchar', length: 100 })
	value: string;

	@Column({ type: 'boolean', default: false })
	isFeatured: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@Column()
	productId: string; // ahora puedes asignar directamente desde el DTO

	@ManyToOne(() => Product, (product) => product.productPhotos, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'productId' }) // asegura el nombre de la FK
	product: Product;

	@ManyToOne(() => Attribute, (attribute) => attribute.productDescriptions, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'attributeId' })
	attribute: Attribute;

	@ManyToOne(() => AttributeValue, (attributeValue) => attributeValue.productDescriptions, {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'attributeValueId' })
	attributeValue: Attribute;
}
