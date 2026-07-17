await queryRunner.query(`
    ALTER SEQUENCE public.categories_code_seq
    OWNED BY public.categories.code;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.subcategories_code_seq
    OWNED BY public.subcategories.code;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.brands_code_seq
    OWNED BY public.brands.code;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.products_code_seq
    OWNED BY public.products.code;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.product_group_code_seq
    OWNED BY public.product_groups.code;
`);


await queryRunner.query(`
    ALTER SEQUENCE public.categories_code_seq
    OWNED BY NONE;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.subcategories_code_seq
    OWNED BY NONE;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.brands_code_seq
    OWNED BY NONE;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.products_code_seq
    OWNED BY NONE;
`);

await queryRunner.query(`
    ALTER SEQUENCE public.product_group_code_seq
    OWNED BY NONE;
`);
