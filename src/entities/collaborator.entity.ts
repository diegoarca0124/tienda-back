import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany, OneToOne, ManyToOne, JoinColumn } from 'typeorm';



@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 }) //sheldo
  names: string

  @Column({ type: 'varchar', length: 100 }) //cooper
  surname: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fullnames: string; 

  @Column({ type: 'jsonb', nullable: true })
	type_document: { name: string; value: string };

  @Column({ type: 'varchar', length: 25})
  number_document: string;

  @Column({ type: 'varchar', length: 100 }) 
  email: string;

  @Column({ type: 'varchar', length: 200 }) 
  password: string;

  @Column({ nullable: true, default: '+51'})
  prefix: string;

  @Column({ length: 20, nullable: true }) // Nueva columna
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })  
  role: string;

  @Column({ type: 'boolean', default: true})
  status: boolean;

  @Column({ nullable: true})
  lastDatelogin: Date;

  @Column({ nullable: true})
  statusAt: Date;

  @UpdateDateColumn()
  updatedAt: Date

  @CreateDateColumn()
  createdAt: Date

} 
