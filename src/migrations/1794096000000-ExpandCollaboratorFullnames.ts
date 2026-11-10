import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandCollaboratorFullnames1794096000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "collaborators" ALTER COLUMN "fullnames" TYPE varchar(201)');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "collaborators" ALTER COLUMN "fullnames" TYPE varchar(100)');
	}
}
