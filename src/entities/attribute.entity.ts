import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AttributeCategory } from './attribute-category.entity';
import { AttributeValue } from './attribute-value.entity';

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string; 

  @Column({ type: 'varchar', length: 150, unique: true })
  code: string; 

  @Column({ type: 'text', nullable: true })
  unit: string; 

  @Column({ type: 'boolean', default: false})
  status: boolean;

  @Column({ nullable: true})
  statusAt: Date;

  @UpdateDateColumn()
  updatedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => AttributeCategory, (attributeCategory) => attributeCategory.attribute)
  attributeCategories: AttributeCategory[];

  @OneToMany(() => AttributeValue, (attributeValue) => attributeValue.attribute)
  attributeValues: AttributeValue[];
}
