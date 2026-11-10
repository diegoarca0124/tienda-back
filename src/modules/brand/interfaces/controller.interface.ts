export interface BrandRequest {
	user: { id: string };
	requestId: string;
}

export interface GetBrandsRes {
	brands: {
		id: string;
		name: string;
		slug: string;
		createdAt: Date;
		status: boolean;
		prefix: string;
		code: string;
		websiteUrl: string | null;
		logoUrl: string | null;
		totalProducts: number;
		latestProducts: { id: string; name: string; code: string; cover: string; brandId: string }[];
		moreProducts: number;
	}[];
	meta: { totalBrands: number; totalPages: number; currentPage: number; limit: number };
	filters: { filter: string; status: 'Todos' | 'Activos' | 'Inactivos'; sort: string; countries?: string };
}

export interface CreateBrandRes {
	data: string;
	message: string;
}

export interface GetBrandRes {
	data: {
		id: string;
		name: string;
		status: boolean;
		logoUrl: string | null;
		bannerUrl: string | null;
		prefix: string;
		code: string;
		country: { code: string; flag: string; name: string } | null;
		websiteUrl: string | null;
		description: string | null;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface UpdateBrandRes {
	data: {
		id: string;
		name: string;
		code: string;
		status: boolean;
		logoUrl: string | null;
		bannerUrl: string | null;
		prefix: string;
		country: { code: string; flag: string; name: string } | null;
		websiteUrl: string | null;
		description: string | null;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface UpdateBrandStatusRes {
	data: { id: string; status: boolean; name: string };
	message: string;
}

export interface UpdateBrandsStatusRes {
	data: string[];
	message: string;
}

export interface FilesCreateBrand {
	logoUrl?: Express.Multer.File[];
	bannerUrl?: Express.Multer.File[];
}

export interface FilesUpdateBrand {
	logoUrl?: Express.Multer.File[];
	bannerUrl?: Express.Multer.File[];
}

export interface BrandSelectItem {
	id: string;
	name: string;
	status: boolean;
	logoUrl: string | null;
}

export interface FindBrandProductsRes {
	brand: string;
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
		categoryIds: string;
		quality: string;
		visibility: string;
		minPrice?: number;
		maxPrice?: number;
	};
}
