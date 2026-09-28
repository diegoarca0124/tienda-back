import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryCascadeIndexes1790300000000 implements MigrationInterface {
	name = 'AddCategoryCascadeIndexes1790300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE INDEX "IDX_SUBCATEGORIES_CATEGORY_ID" ON "subcategories" ("categoryId")`);
		await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_CATEGORY_ID" ON "products" ("categoryId")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_CATEGORY_ID"`);
		await queryRunner.query(`DROP INDEX "IDX_SUBCATEGORIES_CATEGORY_ID"`);
	}
}
