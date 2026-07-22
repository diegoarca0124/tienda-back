import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('collaborators')
@Index('UQ_COLLABORATOR_EMAIL', ['email'], { unique: true })
@Index('UQ_COLLABORATOR_PHONE', ['phone'], { unique: true })
@Index('UQ_COLLABORATOR_DOCUMENT', ['number_document'], { unique: true })
export class Collaborator {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100 })
	names: string;

	@Column({ type: 'varchar', length: 100 })
	surname: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	fullnames: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	type_document: string;

	@Column({ type: 'varchar', length: 25 })
	number_document: string;

	@Column({ type: 'varchar', length: 100 })
	email: string;

	@Column({ type: 'varchar', length: 200 })
	password: string;

	@Column({ nullable: true, default: '+51' })
	prefix: string;

	@Column({ length: 20, nullable: true })
	phone: string;

	@Column({ type: 'varchar', length: 200, nullable: true })
	role: string;

	@Column({ type: 'boolean', default: true })
	status: boolean;

	@Column({ nullable: true })
	lastDatelogin: Date;

	@Column({ nullable: true })
	statusAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@CreateDateColumn()
	createdAt: Date;
}
