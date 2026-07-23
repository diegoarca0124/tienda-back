export interface ProductPreview {
    id: string;
    name: string;
    cover: string | null;
}

export interface RawCategoryProduct extends ProductPreview {
    categoryId: string;
    totalProducts: string;
}

export interface CategoryProductSummary {
    totalProducts: number;
    products: ProductPreview[];
}