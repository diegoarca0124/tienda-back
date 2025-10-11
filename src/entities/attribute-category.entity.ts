import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
} from 'typeorm';
import { Attribute } from './attribute.entity';
import { Category } from './category.entity';

@Entity('attribute_categories')
export class AttributeCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Attribute, (attribute) => attribute.attributeCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;

  @Column()
  attributeId: string;

  @ManyToOne(() => Category, (category) => category.attributeCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string; 

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
