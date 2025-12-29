import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { Category } from './category.entity';
import { Subcategory } from './subcategory.entity';
import { ProductGroupItem } from './product-group-item.entity';

@Entity('product_groups')
export class ProductGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'int',
        default: () => "nextval('product_code_seq')",
    })
    code: number;

    @OneToMany(() => ProductGroupItem, (productGroupItem) => productGroupItem.productGroup)
    productGroupItems: ProductGroupItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
