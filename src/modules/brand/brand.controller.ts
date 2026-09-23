import { Body, Controller, Get, Param, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { FileUploadInterceptor } from './interceptor/files-upload.interceptor';
import { CreateBrandInterceptor } from './interceptor/create-brand.interceptor';
import { CreateBrandDto } from './dto/create-brand.dto';
import { ParseCountryPipe } from './pipes/parse-country.pipe';
import { BrandService } from './brand.service';
import { EditBrandInterceptor } from './interceptor/edit-brand.interceptor';
import { EditBrandDto } from './dto/edit-brand-dto';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { UpdateBrandsStatusDto } from './dto/update-brands-status.dto';
import { UpdateStatusBrandsInterceptor } from './interceptor/update-status-brands.interceptor';
import { FindBrandsQueryDto } from './dto/find-brands.dto';
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
import type { CreateBrandRes, FilesCreateBrand, GetBrandRes, GetBrandsRes, UpdateBrandRes, UpdateBrandsStatusRes, UpdateBrandStatusRes } from './interfaces/controller.interface';
import { UpdateBrandStatusDto } from './dto/update-brand-status.dto';
import { FindBrandProductsQueryDto } from './dto/find-brand-products.dto';

@Controller('brand')
export class BrandController {
	constructor(private brandService: BrandService) {}

	@Post('createBrand')
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), CreateBrandInterceptor)
	async createBrand(
		@UploadedFiles() files: FilesCreateBrand, 
		@Body() dto: CreateBrandDto, 
		@Req() request
	): Promise<CreateBrandRes> {
		return this.brandService.createBrand(dto, files, request);
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

	@Put('updateBrandStatus/:id')
	updateBrandStatus(
		@Param('id', ValidateUUID) id: string, 
		@Body() dto: UpdateBrandStatusDto, 
		@Req() request: any
	): Promise<UpdateBrandStatusRes> {
		return this.brandService.updateBrandStatus(id, dto, request);
	}

	@Post('updateBrandsStatus')
	@UseInterceptors(UpdateStatusBrandsInterceptor)
	updateBrandsStatus(
		@Body() dto: UpdateBrandsStatusDto, 
		@Req() request: any
	): Promise<UpdateBrandsStatusRes>{
		return this.brandService.updateBrandsStatus(dto, request);
	}

	@Get('findBrandProducts/:id')
	findBrandProducts(
		@Param('id', ValidateUUID) id: string,
		@Query(new QueryParamsErrorsPipe(FindBrandProductsQueryDto))
		query: unknown
	) {
		return this.brandService.findBrandProducts(id, query as FindBrandProductsQueryDto);
	}

	@Get('get_brands_by_select')
	get_brands_by_select() {
		return this.brandService.get_brands_by_select();
	}
}
