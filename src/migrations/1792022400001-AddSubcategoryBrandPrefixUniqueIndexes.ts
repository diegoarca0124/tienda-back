import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubcategoryBrandPrefixUniqueIndexes1792022400001 implements MigrationInterface {
	name = 'AddSubcategoryBrandPrefixUniqueIndexes1792022400001';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SUBCATEGORIES_PREFIX_NORMALIZED" ON "subcategories" (LOWER(TRIM("prefix")))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_BRANDS_PREFIX_NORMALIZED" ON "brands" (LOWER(TRIM("prefix")))`);
		await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT IF EXISTS "UQ_ed13bca77ebe87d6dd663ae2a06"`);
		await queryRunner.query(`ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "UQ_0f32d7302e55d3f297c08c1a859"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "subcategories" ADD CONSTRAINT "UQ_ed13bca77ebe87d6dd663ae2a06" UNIQUE ("prefix")`);
		await queryRunner.query(`ALTER TABLE "brands" ADD CONSTRAINT "UQ_0f32d7302e55d3f297c08c1a859" UNIQUE ("prefix")`);
		await queryRunner.query(`DROP INDEX "UQ_BRANDS_PREFIX_NORMALIZED"`);
		await queryRunner.query(`DROP INDEX "UQ_SUBCATEGORIES_PREFIX_NORMALIZED"`);
	}
}
