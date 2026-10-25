import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Generated, Index } from 'typeorm';
import { Product } from './product.entity';

@Entity('brands')
// Expression index created by migration; preserve it during schema synchronization.
@Index('UQ_BRANDS_NAME_NORMALIZED', { synchronize: false })
@Index('UQ_BRANDS_PREFIX_NORMALIZED', { synchronize: false })
@Index('UQ_BRANDS_SLUG', ['slug'], { unique: true })
export class Brand {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 150 })
	name: string;

	@Column({ type: 'varchar' })
	prefix: string;

	@Column({
		type: 'bigint',
		unique: true,
	})
	@Generated('increment')
	code: string;

	@Column({ type: 'varchar', length: 150 })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ type: 'jsonb', nullable: true })
	country: { code: string; flag: string; name: string };

	@Column({ type: 'varchar', length: 255, nullable: true })
	websiteUrl: string | null;

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

	@OneToMany(() => Product, (product) => product.brand)
	products: Product[];
}
