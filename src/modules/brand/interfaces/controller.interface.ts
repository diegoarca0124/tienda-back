import { Brand } from '@/entities/brand.entity';
import { FindBrandsQueryDto } from '../dto/find-brands.dto';

export interface GetBrandsRes {
	brands: Brand[];
	meta: {
		totalBrands: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: Pick<FindBrandsQueryDto, 'filter' | 'status' | 'sort' | 'countries'>;
}

export interface CreateBrandRes {
	data: string;
	message: string;
}

export interface GetBrandRes {
	data: Brand;
	message: string;
}

export interface FilesCreateBrand {
	logoUrl?: Express.Multer.File[];
	bannerUrl?: Express.Multer.File[];
}

export interface UpdateBrandRes {
	data: Brand;
	message: string;
}
