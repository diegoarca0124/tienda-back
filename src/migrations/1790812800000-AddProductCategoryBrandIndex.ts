import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoryBrandIndex1790812800000 implements MigrationInterface {
	name = 'AddProductCategoryBrandIndex1790812800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_CATEGORY_BRAND" ON "products" ("categoryId", "brandId")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_CATEGORY_BRAND"`);
	}
}
