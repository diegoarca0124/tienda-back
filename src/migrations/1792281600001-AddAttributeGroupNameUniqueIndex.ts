import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttributeGroupNameUniqueIndex1792281600001 implements MigrationInterface {
	name = 'AddAttributeGroupNameUniqueIndex1792281600001';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_ATTRIBUTE_GROUPS_NAME_NORMALIZED" ON "attribute_groups" (LOWER(TRIM("name")))`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "UQ_ATTRIBUTE_GROUPS_NAME_NORMALIZED"`);
	}
}
