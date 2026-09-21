import { Body, Controller, Get, Param, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { FileUploadInterceptor } from './interceptor/files-create-brand.interceptor';
import { CreateBrandInterceptor } from './interceptor/create-brand.interceptor';
import { CreateBrandDto } from './dto/create-brand.dto';
import { awsProcessImage } from '@/common/utils/aws-process-image.util';
import { ParseCountryPipe } from './pipes/parse-country.pipe';
import { BrandService } from './brand.service';
import { EditBrandInterceptor } from './interceptor/edit-brand.interceptor';
import { EditBrandDto } from './dto/edit-brand-dto';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { UpdateStatusBrandsDto } from './dto/update-status-brands.dto';
import { UpdateStatusBrandsInterceptor } from './interceptor/update-status-brands.interceptor';
import { FindBrandsQueryDto } from './dto/find-brands.dto';
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
import type { CreateBrandRes, FilesCreateBrand, GetBrandRes, GetBrandsRes, UpdateBrandRes } from './interfaces/controller.interface';

@Controller('brand')
export class BrandController {
	constructor(private brandService: BrandService) {}

	@Post('createBrand')
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), CreateBrandInterceptor)
	async createBrand(@UploadedFiles() files: FilesCreateBrand, @Body() dto: CreateBrandDto, @Req() request): Promise<CreateBrandRes> {
		if (files) {
			if (files.logoUrl) {
				const processedLogo = await awsProcessImage(files.logoUrl[0], 'brands');
				dto.logoUrl = processedLogo;
			}

			if (files.bannerUrl) {
				const processedBanner = await awsProcessImage(files.bannerUrl[0], 'brands');
				dto.bannerUrl = processedBanner;
			}
		}
		return this.brandService.createBrand(dto, request);
	}

	@Get('getBrands')
	getBrands(
		@Query(new QueryParamsErrorsPipe(FindBrandsQueryDto))
		query: unknown
	): Promise<GetBrandsRes> {
		return this.brandService.getBrands(query as FindBrandsQueryDto);
	}

	@Get('getBrand/:id')
	getBrand(@Param('id', ValidateUUID) id): Promise<GetBrandRes> {
		return this.brandService.getBrand(id);
	}

	@Put('updateBrand/:id')
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), EditBrandInterceptor)
	async updateBrand(
		@UploadedFiles() files: FilesCreateBrand, 
		@Body() dto: EditBrandDto, 
		@Param('id', ValidateUUID) id: string, 
		@Req() request: any
	): Promise<UpdateBrandRes> {
		return this.brandService.updateBrand(id, dto, files, request);
	}

	@Put('update_status_brand/:id')
	update_status_brand(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request: any) {
		return this.brandService.update_status_brand(id, data.status, request);
	}

	@Get('get_product_by_brand/:id')
	get_product_by_brand(
		@Param('id', ValidateUUID) id: string,
		@Query() query: { filter: string; page: number; limit: number; status: string; sort: string; subcategoryIds: string }
	) {
		return this.brandService.get_product_by_brand(id, query);
	}

	@Post('update_status_brands')
	@UseInterceptors(UpdateStatusBrandsInterceptor)
	update_status_brands(@Body() updateStatusBrandsDto: UpdateStatusBrandsDto, @Req() request: any) {
		return this.brandService.update_status_brands(updateStatusBrandsDto, request);
	}

	@Get('get_brands_by_select')
	get_brands_by_select() {
		return this.brandService.get_brands_by_select();
	}
}
