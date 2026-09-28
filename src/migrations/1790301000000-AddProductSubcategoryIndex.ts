import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSubcategoryIndex1790301000000 implements MigrationInterface {
	name = 'AddProductSubcategoryIndex1790301000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_SUBCATEGORY_ID" ON "products" ("subcategoryId")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_SUBCATEGORY_ID"`);
	}
}
