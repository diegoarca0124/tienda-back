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
import { Category } from './category.entity';

@Entity('subcategories')
export class Subcategory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	name: string;

	@Column({ type: 'varchar', length: 500, nullable: true })
	slug: string;

	@Column({ type: 'varchar', length: 2000, nullable: true })
	icon: string;

	@Column({ type: 'boolean', default: false })
	status: boolean;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@Column()
	categoryId: string; // ahora puedes asignar directamente desde el DTO

	@ManyToOne(() => Category, (category) => category.subcategories, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' }) // asegura el nombre de la FK
	category: Category;

	/* @OneToMany(() => Product, (product) => product.subcategory)
	products: Product[]; */
}
