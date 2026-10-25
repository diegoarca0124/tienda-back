import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandUniqueIndexes1791763200000 implements MigrationInterface {
	name = 'AddBrandUniqueIndexes1791763200000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_BRANDS_NAME_NORMALIZED" ON "brands" (LOWER(TRIM("name")))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_BRANDS_SLUG" ON "brands" ("slug")`);
		await queryRunner.query(`ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "UQ_96db6bbbaa6f23cad26871339b6"`);
		await queryRunner.query(`ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "UQ_b15428f362be2200922952dc268"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "brands" ADD CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name")`);
		await queryRunner.query(`ALTER TABLE "brands" ADD CONSTRAINT "UQ_b15428f362be2200922952dc268" UNIQUE ("slug")`);
		await queryRunner.query(`DROP INDEX "UQ_BRANDS_SLUG"`);
		await queryRunner.query(`DROP INDEX "UQ_BRANDS_NAME_NORMALIZED"`);
	}
}
