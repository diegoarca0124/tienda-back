import { Category } from '@/entities/category.entity';
import { FindCategoriesQueryDto } from '../dto/find-categories.dto';
import { Subcategory } from '@/entities/subcategory.entity';

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

export interface GetSubcategoriesRes {
	data: Subcategory[];
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
		affectedProducts: number;
	};
}

export interface GetCategoriesWithSubcategoriesRes {
	data: {
		id: string;
		name: string;
		icon: string;
		prefix: string;
		color: string;
		subcategories: {
			id: string;
			name: string;
			icon: string;
			prefix: string;
			categoryId: string;
		}[];
	}[];
	message: string;
}

export interface MoveProductsToSubcategoryRes {
	data: number;
	message: string;
}