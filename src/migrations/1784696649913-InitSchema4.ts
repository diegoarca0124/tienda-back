import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema41784696649913 implements MigrationInterface {
    name = 'InitSchema41784696649913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "websiteUrl" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_COLLABORATOR_DOCUMENT" ON "collaborators" ("number_document") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_COLLABORATOR_PHONE" ON "collaborators" ("phone") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_COLLABORATOR_EMAIL" ON "collaborators" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_COLLABORATOR_EMAIL"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_COLLABORATOR_PHONE"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_COLLABORATOR_DOCUMENT"`);
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "websiteUrl" SET NOT NULL`);
    }

}
