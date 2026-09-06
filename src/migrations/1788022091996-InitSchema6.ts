import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema61788022091996 implements MigrationInterface {
	name = 'InitSchema61788022091996';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "categories" ADD "color" character varying(7) DEFAULT '#abacad'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "color"`);
	}
}
