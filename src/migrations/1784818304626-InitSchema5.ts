import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema51784818304626 implements MigrationInterface {
    name = 'InitSchema51784818304626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "isConditiom" TO "isCondition"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "isCondition" TO "isConditiom"`);
    }

}
