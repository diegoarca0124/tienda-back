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
@Entity('product_descriptions')
export class ProductDescription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    attribute: string;

    @Column({ type: 'varchar', length: 100 })
    value: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    productId: string; // ahora puedes asignar directamente desde el DTO

    @ManyToOne(() => Product, (product) => product.productPhotos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' }) // asegura el nombre de la FK
    product: Product;
}
