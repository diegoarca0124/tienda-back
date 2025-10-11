import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBrandTable1756060460936 implements MigrationInterface {
    name = 'CreateBrandTable1756060460936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "brands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "slug" character varying(150) NOT NULL, "description" text, "country" jsonb, "websiteUrl" character varying(255) NOT NULL, "logoUrl" character varying(255), "bannerUrl" character varying(255), "status" boolean NOT NULL DEFAULT false, "statusAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"), CONSTRAINT "UQ_b15428f362be2200922952dc268" UNIQUE ("slug"), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "brands"`);
    }

}
