import { Category } from '@/entities/category.entity';
import { FindCategoriesQueryDto } from '../dto/find-categories.dto';
import { Subcategory } from '@/entities/subcategory.entity';
import { Product } from '@/entities/product.entity';
import { FindCategoryProductsQueryDto } from '../dto/find-category-products.dto';
import { Brand } from '@/entities/brand.entity';

export interface GetCategoriesRes {
	categories: Category[];
	meta: {
		totalCategories: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: Pick<FindCategoriesQueryDto, 'filter' | 'status' | 'sort' | 'configurations'>;
}

export interface CreateCategoryRes {
	data: string;
	message: string;
}

export interface UpdateCategoryRes {
	data: Category;
	message: string;
}

export interface UpdateSubcategoryRes {
	data: Subcategory;
	message: string;
}

export interface CreateSubcategoryRes {
	data: Subcategory;
	message: string;
}

export interface GetCategoryRes {
	data: Category;
	message: string;
}

export interface GetSubcategoriesByCategorySelect {
	data: Subcategory[];
	message: string;
}

export interface GetSubcategoriesRes {
	data: Subcategory[];
	message: string;
}

export interface GetBrandsByCategoryRes {
	data: Brand[];
	message: string;
}

export interface UpdateCategoriesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateSubcategoryStatusRes {
	data: Subcategory;
	message: string;
}

export interface UpdateSubcategoriesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateCategoryStatusRes {
	data: Category;
	message: string;
}

export interface MoveSubcategoryRes {
	message: string;
	data: {
		id: string;
		name: string;
		categoryId: string;
		status: boolean;
		affectedProducts: number;
	};
}

export interface GetCategoriesWithSubcategoriesRes {
	data: (Pick<Category, 'id' | 'name' | 'icon' | 'color' | 'status'> & {
		subcategories: Pick<Subcategory, 'id' | 'name' | 'categoryId' | 'status'>[];
	})[];
	message: string;
}

export interface MoveProductsToSubcategoryRes {
	data: number;
	message: string;
}

export interface FindCategoryProductsRes {
	category: string;
	products: Product[];
	meta: {
		totalProducts: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: Omit<
		Pick<FindCategoryProductsQueryDto, 'filter' | 'status' | 'sort' | 'subcategoryIds' | 'brandIds' | 'quality' | 'visibility' | 'minPrice' | 'maxPrice'>,
		'subcategoryIds' | 'brandIds'
	> & {
		subcategoryIds: string;
		brandIds: string;
	};
}
