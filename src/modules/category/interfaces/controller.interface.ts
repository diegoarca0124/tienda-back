export interface CategoryRequest {
	user: { id: string };
	requestId: string;
}

export interface GetCategoriesRes {
	categories: {
		id: string;
		name: string;
		code: string;
		icon: string | null;
		description: string;
		prefix: string;
		color: string | null;
		isDimensions: boolean;
		isCharacteristics: boolean;
		isCondition: boolean;
		isWarranty: boolean;
		isCountryOfOrigin: boolean;
		isMaterial: boolean;
		isTemperature: boolean;
		status: boolean;
		createdAt: Date;
		totalProducts: number;
		latestProducts: {
			id: string;
			name: string;
			code: string;
			cover: string;
			categoryId: string;
		}[];
		moreProducts: number;
	}[];
	meta: {
		totalCategories: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: { filter: string; status: 'Todos' | 'Activos' | 'Inactivos'; sort: 'Predeterminado' | 'name:asc' | 'name:desc'; configurations: string[] };
}

export interface CreateCategoryRes {
	data: string;
	message: string;
}

export interface UpdateCategoryRes {
	data: {
		id: string;
		name: string;
		code: string;
		slug: string;
		icon: string | null;
		description: string;
		prefix: string;
		color: string | null;
		isDimensions: boolean;
		isCharacteristics: boolean;
		isCondition: boolean;
		isWarranty: boolean;
		isCountryOfOrigin: boolean;
		isMaterial: boolean;
		isTemperature: boolean;
		status: boolean;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface UpdateSubcategoryRes {
	data: {
		id: string;
		name: string | null;
		code: string;
		prefix: string;
		slug: string | null;
		icon: string | null;
		categoryId: string;
		status: boolean;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface CreateSubcategoryRes {
	data: string;
	message: string;
}

export interface GetCategoryRes {
	data: {
		id: string;
		name: string;
		code: string;
		slug: string;
		icon: string | null;
		description: string;
		prefix: string;
		color: string | null;
		isDimensions: boolean;
		isCharacteristics: boolean;
		isCondition: boolean;
		isWarranty: boolean;
		isCountryOfOrigin: boolean;
		isMaterial: boolean;
		isTemperature: boolean;
		status: boolean;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface GetSubcategoriesByCategorySelect {
	data: {
		id: string;
		name: string | null;
		icon: string | null;
		prefix: string;
		code: string;
		status: boolean;
		totalProducts: number;
	}[];
	message: string;
}

export interface GetSubcategoriesRes {
	data: {
		id: string;
		name: string | null;
		code: string;
		prefix: string;
		slug: string | null;
		icon: string | null;
		categoryId: string;
		status: boolean;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	}[];
	message: string;
}

export interface GetBrandsByCategoryRes {
	data: {
		id: string;
		name: string;
		logoUrl: string | null;
		status: boolean;
		websiteUrl: string | null;
	}[];
	message: string;
}

export interface UpdateCategoriesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateSubcategoryStatusRes {
	data: { id: string; name: string | null; status: boolean; statusAt: Date | null };
	message: string;
}

export interface UpdateSubcategoriesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateCategoryStatusRes {
	data: { id: string; name: string; status: boolean; statusAt: Date | null };
	message: string;
}

export interface MoveSubcategoryRes {
	message: string;
	data: {
		id: string;
		name: string | null;
		categoryId: string;
		status: boolean;
		affectedProducts: number;
	};
}

export interface GetCategoriesWithSubcategoriesRes {
	data: {
		code: string;
		id: string;
		name: string;
		prefix: string;
		icon: string | null;
		color: string | null;
		status: boolean;
		subcategories: {
			code: string;
			id: string;
			name: string | null;
			prefix: string;
			categoryId: string;
			status: boolean;
		}[];
	}[];
	message: string;
}

export interface MoveProductsToSubcategoryRes {
	data: number;
	message: string;
}

export interface FindCategoryProductsRes {
	category: string;
	products: {
		id: string;
		name: string;
		cover: string;
		status: 'draft' | 'published';
		visibility: 'public' | 'private';
		createdAt: Date;
		priceRegular: string | number;
		priceDiscount: string | number | null;
		quality: number;
		quality_label: string;
		stockQuantity: number | null;
		category: { id: string; name: string };
		subcategory: { id: string; name: string; prefix: string; code: string };
		brand: { id: string; name: string; logoUrl: string };
	}[];
	meta: {
		totalProducts: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: {
		filter: string;
		status: 'Todos' | 'published' | 'draft';
		sort: string;
		subcategoryIds: string;
		brandIds: string;
		quality: string;
		visibility: string;
		minPrice?: number;
		maxPrice?: number;
	};
}

export interface GetSubcategoryRes {
	data: {
		id: string;
		name: string | null;
		code: string;
		prefix: string;
		slug: string | null;
		icon: string | null;
		categoryId: string;
		status: boolean;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}
export interface GetCategoriesSelectRes {
	data: {
		id: string;
		name: string;
		icon: string | null;
		prefix: string;
		status: boolean;
		isDimensions: boolean;
		isCharacteristics: boolean;
		isCondition: boolean;
		isWarranty: boolean;
		isCountryOfOrigin: boolean;
		isMaterial: boolean;
		isTemperature: boolean;
	}[];
	message: string;
}
export interface GetCategorySubcategorySelectionRes {
	data: {
		id: string;
		name: string;
		prefix: string;
		status: boolean;
		subcategories: {
			id: string;
			name: string | null;
			prefix: string;
			status: boolean;
			checked: boolean;
		}[];
	}[];
	message: string;
}
export interface CategoryProduct {
	id: string;
	name: string;
	cover: string;
	status: 'draft' | 'published';
	visibility: 'public' | 'private';
	createdAt: Date;
	priceRegular: string | number;
	priceDiscount: string | number | null;
	quality: number;
	quality_label: string;
	stockQuantity: number | null;
	category: { id: string; name: string };
	subcategory: { id: string; name: string; prefix: string; code: string };
	brand: { id: string; name: string; logoUrl: string };
}

export interface MovedSubcategory {
	id: string;
	name: string | null;
	categoryId: string;
	status: boolean;
}
export interface CategoryValidationBody {
	name?: unknown;
	icon?: unknown;
	prefix?: unknown;
}
export interface CategoryRouteRequest {
	params: { id: string };
}
