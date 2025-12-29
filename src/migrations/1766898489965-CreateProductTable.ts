import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductTable1766898489965 implements MigrationInterface {
    name = 'CreateProductTable1766898489965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying(500) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "productId" uuid NOT NULL, CONSTRAINT "PK_0586e8a3f1766827efaf0ee3943" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_seos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metaTitle" character varying(160), "metaDescription" character varying(255), "metaKeywords" character varying(255), "ogTitle" character varying(255), "ogDescription" character varying(255), "ogImage" character varying(255), "twitterCardType" character varying(100), "isIndexable" boolean NOT NULL DEFAULT true, "structuredData" jsonb, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_aa9cd77162626cd7dc1b88dbe3" UNIQUE ("productId"), CONSTRAINT "PK_72070635f0c7d6eb2bbc3c08c4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_physicals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weight" numeric(10,2), "weightUnit" jsonb, "height" numeric(10,2), "width" numeric(10,2), "length" numeric(10,2), "dimensionUnit" jsonb, "isFragile" boolean NOT NULL DEFAULT false, "isPerishable" boolean NOT NULL DEFAULT false, "isEcoFriendly" boolean NOT NULL DEFAULT false, "isBiodegradable" boolean NOT NULL DEFAULT false, "isHazardous" boolean NOT NULL DEFAULT false, "isRequiresRefrigeration" boolean NOT NULL DEFAULT false, "isFlammable" boolean NOT NULL DEFAULT false, "isRequiresAssembly" boolean NOT NULL DEFAULT false, "minStorageTemp" numeric(5,2), "maxStorageTemp" numeric(5,2), "storageTempUnit" jsonb, "material" character varying(50), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "productId" uuid NOT NULL, CONSTRAINT "REL_f40d5610190ba9499035ac46b7" UNIQUE ("productId"), CONSTRAINT "PK_d90d2945609ce33a793e15f66ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_shippings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "freeShipping" boolean NOT NULL DEFAULT false, "handlingDays" integer NOT NULL DEFAULT '0', "packageType" character varying(50), "pickupInStore" boolean NOT NULL DEFAULT false, "specialInstructions" text, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_b0e57b11a849fc8ceeb628ddec" UNIQUE ("productId"), CONSTRAINT "PK_aa0c8dfe1e40305bda2edca3941" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "skuPattern" character varying(255) NOT NULL, "sku" character varying(255) NOT NULL, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" integer NOT NULL DEFAULT nextval('product_code_seq'), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bccc8805f3453d0cce77c1beedb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_group_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productGroupId" uuid NOT NULL, "productId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_07abafb92bd07cdba526ed4802e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "visibility" character varying NOT NULL, "name" character varying(250) NOT NULL, "type" character varying(100) NOT NULL, "slug" character varying(500) NOT NULL, "description" character varying NOT NULL, "extract" character varying NOT NULL, "cover" character varying NOT NULL, "miniature" character varying NOT NULL, "mainAttribute" jsonb, "mainAttributeValue" character varying(100), "unitOfMeasure" jsonb, "condition" character varying(100), "warranty" character varying(100), "countryOfOrigin" jsonb, "priceRegular" numeric(10,2) NOT NULL, "priceDiscount" numeric(10,2), "tags" text, "brandId" uuid NOT NULL, "categoryId" uuid NOT NULL, "subcategoryId" uuid NOT NULL, "stockQuantity" integer DEFAULT '0', "reviewsCount" integer NOT NULL DEFAULT '0', "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "viewsCount" integer NOT NULL DEFAULT '0', "salesCount" integer NOT NULL DEFAULT '0', "isBestSeller" boolean NOT NULL DEFAULT false, "isNewArrival" boolean NOT NULL DEFAULT false, "isFeatured" boolean NOT NULL DEFAULT false, "isLimitedEdition" boolean NOT NULL DEFAULT false, "isPreOrder" boolean NOT NULL DEFAULT false, "isExportable" boolean NOT NULL DEFAULT false, "allowBackorder" boolean NOT NULL DEFAULT false, "statusAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_descriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attribute" character varying(100) NOT NULL, "value" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "productId" uuid NOT NULL, CONSTRAINT "PK_8448465bc4faa6348b235d9b087" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_photos" ADD CONSTRAINT "FK_9c18967daa2898d149078cb8282" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_seos" ADD CONSTRAINT "FK_aa9cd77162626cd7dc1b88dbe34" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_physicals" ADD CONSTRAINT "FK_f40d5610190ba9499035ac46b7f" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_shippings" ADD CONSTRAINT "FK_b0e57b11a849fc8ceeb628ddec9" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_group_items" ADD CONSTRAINT "FK_22370b16053aa1cc1c811793aa0" FOREIGN KEY ("productGroupId") REFERENCES "product_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_group_items" ADD CONSTRAINT "FK_7b78a18c416277a1f9f441da3b9" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_7527f75cb36bea4b7f2b86f7d1d" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_descriptions" ADD CONSTRAINT "FK_89f08ce8a98d50a29ebabf0c5ca" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_descriptions" DROP CONSTRAINT "FK_89f08ce8a98d50a29ebabf0c5ca"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_7527f75cb36bea4b7f2b86f7d1d"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df"`);
        await queryRunner.query(`ALTER TABLE "product_group_items" DROP CONSTRAINT "FK_7b78a18c416277a1f9f441da3b9"`);
        await queryRunner.query(`ALTER TABLE "product_group_items" DROP CONSTRAINT "FK_22370b16053aa1cc1c811793aa0"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_f515690c571a03400a9876600b5"`);
        await queryRunner.query(`ALTER TABLE "product_shippings" DROP CONSTRAINT "FK_b0e57b11a849fc8ceeb628ddec9"`);
        await queryRunner.query(`ALTER TABLE "product_physicals" DROP CONSTRAINT "FK_f40d5610190ba9499035ac46b7f"`);
        await queryRunner.query(`ALTER TABLE "product_seos" DROP CONSTRAINT "FK_aa9cd77162626cd7dc1b88dbe34"`);
        await queryRunner.query(`ALTER TABLE "product_photos" DROP CONSTRAINT "FK_9c18967daa2898d149078cb8282"`);
        await queryRunner.query(`DROP TABLE "product_descriptions"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_group_items"`);
        await queryRunner.query(`DROP TABLE "product_groups"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`DROP TABLE "product_shippings"`);
        await queryRunner.query(`DROP TABLE "product_physicals"`);
        await queryRunner.query(`DROP TABLE "product_seos"`);
        await queryRunner.query(`DROP TABLE "product_photos"`);
    }

}
