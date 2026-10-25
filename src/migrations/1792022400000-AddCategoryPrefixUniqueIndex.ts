import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryPrefixUniqueIndex1792022400000 implements MigrationInterface {
	name = 'AddCategoryPrefixUniqueIndex1792022400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_CATEGORIES_PREFIX_NORMALIZED" ON "categories" (LOWER(TRIM("prefix")))`);
		await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "UQ_1f8cfddd595b07a0726c55a22d8"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_1f8cfddd595b07a0726c55a22d8" UNIQUE ("prefix")`);
		await queryRunner.query(`DROP INDEX "UQ_CATEGORIES_PREFIX_NORMALIZED"`);
	}
}
