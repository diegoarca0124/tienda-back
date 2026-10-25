import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignAttributeCreation1792281600000 implements MigrationInterface {
	name = 'AlignAttributeCreation1792281600000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ATTRIBUTES_GROUP_NAME_NORMALIZED" ON "attributes" ("attributeGroupId", LOWER(TRIM("name")))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ATTRIBUTE_VALUES_NORMALIZED" ON "attribute_values" ("attributeId", LOWER(TRIM("value")))`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "UQ_ATTRIBUTE_VALUES_NORMALIZED"`);
		await queryRunner.query(`DROP INDEX "UQ_ATTRIBUTES_GROUP_NAME_NORMALIZED"`);
	}
}
