import { Category } from '@/entities/category.entity';
import { FindCategoriesQueryDto } from '../dto/find-categories.dto';

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

export interface UpdateCategoriesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateCategoryStatusRes {
	data: Category;
	message: string;
}
