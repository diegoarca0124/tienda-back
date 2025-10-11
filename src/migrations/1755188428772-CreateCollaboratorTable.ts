import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCollaboratorTable1755188428772 implements MigrationInterface {
    name = 'CreateCollaboratorTable1755188428772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "names" character varying(100) NOT NULL, "surname" character varying(100) NOT NULL, "fullnames" character varying(100), "type_document" character varying(25) NOT NULL, "number_document" character varying(25) NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(200) NOT NULL, "prefix" character varying DEFAULT '+51', "phone" character varying(20), "role" character varying(200), "status" boolean NOT NULL DEFAULT true, "lastDatelogin" TIMESTAMP, "statusAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f579a5df9d66287f400806ad875" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "collaborators"`);
    }

}
