import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema21782900342263 implements MigrationInterface {
    name = 'InitSchema21782900342263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributes" DROP CONSTRAINT "UQ_89afb34fd1fdb2ceb1cea6c57df"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributes" ADD CONSTRAINT "UQ_89afb34fd1fdb2ceb1cea6c57df" UNIQUE ("name")`);
    }

}
