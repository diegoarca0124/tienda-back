import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('brands')
export class Brand {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 150, unique: true })
	name: string;

	@Column({ type: 'varchar', length: 150, unique: true })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ type: 'jsonb', nullable: true })
	country: { code: string; flag: string; name: string };

	@Column({ type: 'varchar', length: 255 })
	websiteUrl: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	logoUrl: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	bannerUrl: string;

	@Column({ type: 'boolean', default: false })
	status: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	/* @OneToMany(() => Product, (product) => product.brand)
	products: Product[]; */
}
