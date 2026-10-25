import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttributeCategoryUniqueIndex1792454400000 implements MigrationInterface {
	name = 'AddAttributeCategoryUniqueIndex1792454400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ATTRIBUTE_CATEGORIES_GROUP_CATEGORY" ON "attribute_categories" ("attributeGroupId", "categoryId")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "UQ_ATTRIBUTE_CATEGORIES_GROUP_CATEGORY"`);
	}
}
