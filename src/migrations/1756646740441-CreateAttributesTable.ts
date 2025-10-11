import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttributesTable1756646740441 implements MigrationInterface {
    name = 'CreateAttributesTable1756646740441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attribute_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "value" character varying(150) NOT NULL, "code" character varying(150) NOT NULL, "status" boolean NOT NULL DEFAULT false, "statusAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "attributeId" uuid NOT NULL, CONSTRAINT "PK_3babf93d1842d73e7ba849c0160" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "code" character varying(150) NOT NULL, "unit" text, "status" boolean NOT NULL DEFAULT false, "statusAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_89afb34fd1fdb2ceb1cea6c57df" UNIQUE ("name"), CONSTRAINT "UQ_5530558b04086e0488462b97d37" UNIQUE ("code"), CONSTRAINT "PK_32216e2e61830211d3a5d7fa72c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attribute_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attributeId" uuid NOT NULL, "categoryId" uuid NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ec26bb4c14f372881793b1884a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "attribute_values" ADD CONSTRAINT "FK_b8f8e1d9141248b538c9285574e" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attribute_categories" ADD CONSTRAINT "FK_65084372ab8ab3df1db3ebb7963" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attribute_categories" ADD CONSTRAINT "FK_a4369ccc2282b6e34371a98087c" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attribute_categories" DROP CONSTRAINT "FK_a4369ccc2282b6e34371a98087c"`);
        await queryRunner.query(`ALTER TABLE "attribute_categories" DROP CONSTRAINT "FK_65084372ab8ab3df1db3ebb7963"`);
        await queryRunner.query(`ALTER TABLE "attribute_values" DROP CONSTRAINT "FK_b8f8e1d9141248b538c9285574e"`);
        await queryRunner.query(`DROP TABLE "attribute_categories"`);
        await queryRunner.query(`DROP TABLE "attributes"`);
        await queryRunner.query(`DROP TABLE "attribute_values"`);
    }

}
