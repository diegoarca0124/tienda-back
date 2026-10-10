import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryUniqueIndexes1791504000000 implements MigrationInterface {
	name = 'AddCategoryUniqueIndexes1791504000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_CATEGORIES_NAME_NORMALIZED" ON "categories" (LOWER(TRIM("name")))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_CATEGORIES_SLUG" ON "categories" ("slug")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SUBCATEGORIES_NAME_NORMALIZED" ON "subcategories" (LOWER(TRIM("name")))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SUBCATEGORIES_SLUG" ON "subcategories" ("slug")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "UQ_SUBCATEGORIES_SLUG"`);
		await queryRunner.query(`DROP INDEX "UQ_SUBCATEGORIES_NAME_NORMALIZED"`);
		await queryRunner.query(`DROP INDEX "UQ_CATEGORIES_SLUG"`);
		await queryRunner.query(`DROP INDEX "UQ_CATEGORIES_NAME_NORMALIZED"`);
	}
}
