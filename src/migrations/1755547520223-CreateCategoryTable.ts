import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoryTable1755547520223 implements MigrationInterface {
    name = 'CreateCategoryTable1755547520223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(500) NOT NULL, "icon" character varying(2000) NOT NULL, "description" character varying(2000) NOT NULL, "status" boolean NOT NULL DEFAULT false, "statusAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
