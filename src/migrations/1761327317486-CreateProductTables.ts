import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductTables1761327317486 implements MigrationInterface {
    name = 'CreateProductTables1761327317486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "productId" uuid NOT NULL, CONSTRAINT "PK_0586e8a3f1766827efaf0ee3943" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_seos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metaTitle" character varying(160), "metaDescription" character varying(255), "metaKeywords" character varying(255), "ogTitle" character varying(255), "ogDescription" character varying(255), "ogImage" character varying(255), "twitterCardType" character varying(100), "isIndexable" boolean NOT NULL DEFAULT true, "structuredData" jsonb, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_aa9cd77162626cd7dc1b88dbe3" UNIQUE ("productId"), CONSTRAINT "PK_72070635f0c7d6eb2bbc3c08c4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_physicals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weight" numeric(10,2), "weightUnit" character varying(20) NOT NULL DEFAULT 'kg', "height" numeric(10,2), "width" numeric(10,2), "length" numeric(10,2), "dimensionUnit" character varying(20) NOT NULL DEFAULT 'cm', "isFragile" boolean NOT NULL DEFAULT false, "isPerishable" boolean NOT NULL DEFAULT false, "isEcoFriendly" boolean NOT NULL DEFAULT false, "isBiodegradable" boolean NOT NULL DEFAULT false, "isHazardous" boolean NOT NULL DEFAULT false, "idRequiresRefrigeration" boolean NOT NULL DEFAULT false, "isFlammable" boolean NOT NULL DEFAULT false, "isRequiresAssembly" boolean NOT NULL DEFAULT false, "minStorageTemp" numeric(5,2), "maxStorageTemp" numeric(5,2), "storageTempUnit" character varying(5) DEFAULT '°C', "material" character varying(50), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "productId" uuid NOT NULL, CONSTRAINT "REL_f40d5610190ba9499035ac46b7" UNIQUE ("productId"), CONSTRAINT "PK_d90d2945609ce33a793e15f66ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(250) NOT NULL, "type" character varying(100) NOT NULL, "slug" character varying(500) NOT NULL, "description" character varying NOT NULL, "cover" character varying NOT NULL, "tags" text, "labels" text, "onSale" boolean NOT NULL DEFAULT false, "freeShipping" boolean NOT NULL DEFAULT false, "price" numeric(10,2) NOT NULL, "brandId" uuid NOT NULL, "categoryId" uuid NOT NULL, "subcategoryId" uuid NOT NULL, "countryOfOrigin" character varying(100), "status" boolean NOT NULL DEFAULT false, "statusAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subcategories" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subcategories" ALTER COLUMN "slug" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subcategories" ALTER COLUMN "icon" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_photos" ADD CONSTRAINT "FK_9c18967daa2898d149078cb8282" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_seos" ADD CONSTRAINT "FK_aa9cd77162626cd7dc1b88dbe34" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_physicals" ADD CONSTRAINT "FK_f40d5610190ba9499035ac46b7f" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_7527f75cb36bea4b7f2b86f7d1d" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_7527f75cb36bea4b7f2b86f7d1d"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df"`);
        await queryRunner.query(`ALTER TABLE "product_physicals" DROP CONSTRAINT "FK_f40d5610190ba9499035ac46b7f"`);
        await queryRunner.query(`ALTER TABLE "product_seos" DROP CONSTRAINT "FK_aa9cd77162626cd7dc1b88dbe34"`);
        await queryRunner.query(`ALTER TABLE "product_photos" DROP CONSTRAINT "FK_9c18967daa2898d149078cb8282"`);
        await queryRunner.query(`ALTER TABLE "subcategories" ALTER COLUMN "icon" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subcategories" ALTER COLUMN "slug" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subcategories" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_physicals"`);
        await queryRunner.query(`DROP TABLE "product_seos"`);
        await queryRunner.query(`DROP TABLE "product_photos"`);
    }

}
