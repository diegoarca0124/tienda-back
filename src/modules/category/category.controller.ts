import { Body, Controller, Get, Param, Post, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import { CreateCategoryInterceptor } from './interceptor/create-category.interceptor';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryService } from './category.service';
import { EditCategoryInterceptor } from './interceptor/edit-category.interceptor';
import { EditCategoryDto } from './dto/edit-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { CreateSubcategoryInterceptor } from './interceptor/create-subcategory.interceptor';
import { EditSubcategoryDto } from './dto/edit-subcategory.dto';
import { EditSubcategoryInterceptor } from './interceptor/edit-subcategory.interceptor';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { UpdateStatusCategoriesInterceptor } from './interceptor/update-categories-status.interceptor';
import { UpdatCategoriesStatusDto } from './dto/update-categories-status.dto';
import { UpdateSubcategoriesStatusInterceptor } from './interceptor/update-subcategories-status.interceptor';
import { UpdateSubcategoriesStatusDto } from './dto/update-subcategories-status.dto';
import { UpdateCatSubcatProductsInterceptor } from './interceptor/update-catsubcat-produtcs.interceptor';
import { UpdateCatSubcatProductsDto } from './dto/update-catsubcat-products.dto';
import { MoveSubcategoryDto } from './dto/move-subcategory.dto';
import { MoveSubcategoryInterceptor } from './interceptor/move-subcategory.interceptor';
import { FindCategoryProductsQueryDto } from './dto/find-category-products.dto';
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
import { FindCategoriesQueryDto } from './dto/find-categories.dto';
import { GetSubcategoriesQueryDto } from './dto/get-subcategories.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';
import type {
	CategoryRequest,
	GetSubcategoryRes,
	GetCategoriesSelectRes,
	GetCategorySubcategorySelectionRes,
	CreateCategoryRes,
	CreateSubcategoryRes,
	FindCategoryProductsRes,
	GetCategoriesRes,
	GetBrandsByCategoryRes,
	GetCategoriesWithSubcategoriesRes,
	GetCategoryRes,
	GetSubcategoriesByCategorySelect,
	GetSubcategoriesRes,
	MoveProductsToSubcategoryRes,
	MoveSubcategoryRes,
	UpdateCategoriesStatusRes,
	UpdateCategoryRes,
	UpdateCategoryStatusRes,
	UpdateSubcategoriesStatusRes,
	UpdateSubcategoryRes,
	UpdateSubcategoryStatusRes,
} from './interfaces/controller.interface';
import { UpdateSubcategoryStatusDto } from './dto/update-subcategory-status.dto';

@Controller('category')
export class CategoryController {
	constructor(private categoryService: CategoryService) {}

	@Post('createCategory')
	@UseInterceptors(CreateCategoryInterceptor)
	createCategory(@Body() dto: CreateCategoryDto, @Req() request: CategoryRequest): Promise<CreateCategoryRes> {
		return this.categoryService.createCategory(dto, request);
	}

	@Get('getCategories')
	getCategories(
		@Query(new QueryParamsErrorsPipe(FindCategoriesQueryDto))
		query: unknown
	): Promise<GetCategoriesRes> {
		return this.categoryService.getCategories(query as FindCategoriesQueryDto);
	}

	@Put('updateCategoryStatus/:id')
	updateCategoryStatus(@Param('id', ValidateUUID) id: string, @Body() dto: UpdateCategoryStatusDto, @Req() request: CategoryRequest): Promise<UpdateCategoryStatusRes> {
		return this.categoryService.updateCategoryStatus(id, dto, request);
	}

	@Post('updateCategoriesStatus')
	@UseInterceptors(UpdateStatusCategoriesInterceptor)
	updateCategoriesStatus(@Body() dto: UpdatCategoriesStatusDto, @Req() request: CategoryRequest): Promise<UpdateCategoriesStatusRes> {
		return this.categoryService.updateCategoriesStatus(dto, request);
	}

	@Get('getCategory/:id')
	getCategory(@Param('id', ValidateUUID) id: string): Promise<GetCategoryRes> {
		return this.categoryService.getCategory(id);
	}

	@Put('updateCategory/:id')
	@UseInterceptors(EditCategoryInterceptor)
	updateCategory(@Param('id', ValidateUUID) id: string, @Body() dto: EditCategoryDto, @Req() request: CategoryRequest): Promise<UpdateCategoryRes> {
		return this.categoryService.updateCategory(id, dto, request);
	}

	@Post('createSubcategory')
	@UseInterceptors(CreateSubcategoryInterceptor)
	createSubcategory(@Body() dto: CreateSubcategoryDto, @Req() request: CategoryRequest): Promise<CreateSubcategoryRes> {
		return this.categoryService.createSubcategory(dto, request);
	}

	@Get('getSubcategory/:id')
	getSubcategory(@Param('id', ValidateUUID) id: string): Promise<GetSubcategoryRes> {
		return this.categoryService.getSubcategory(id);
	}

	@Get('getSubcategories/:id')
	getSubcategories(@Param('id', ValidateUUID) id: string, @Query(new QueryParamsErrorsPipe(GetSubcategoriesQueryDto)) query: unknown): Promise<GetSubcategoriesRes> {
		return this.categoryService.getSubcategories(id, (query as GetSubcategoriesQueryDto).filter);
	}

	@Get('getBrandsByCategory/:categoryId')
	getBrandsByCategory(@Param('categoryId', ValidateUUID) categoryId: string): Promise<GetBrandsByCategoryRes> {
		return this.categoryService.getBrandsByCategory(categoryId);
	}

	@Put('updateSubcategoryStatus/:id')
	updateSubcategoryStatus(@Param('id', ValidateUUID) id: string, @Body() dto: UpdateSubcategoryStatusDto, @Req() request: CategoryRequest): Promise<UpdateSubcategoryStatusRes> {
		return this.categoryService.updateSubcategoryStatus(id, dto, request);
	}

	@Post('updateSubcategoriesStatus')
	@UseInterceptors(UpdateSubcategoriesStatusInterceptor)
	updateSubcategoriesStatus(@Body() dto: UpdateSubcategoriesStatusDto, @Req() request: CategoryRequest): Promise<UpdateSubcategoriesStatusRes> {
		return this.categoryService.updateSubcategoriesStatus(dto, request);
	}

	@Put('updateSubcategory/:id')
	@UseInterceptors(EditSubcategoryInterceptor)
	updateSubcategory(@Param('id', ValidateUUID) id: string, @Body() dto: EditSubcategoryDto, @Req() request: CategoryRequest): Promise<UpdateSubcategoryRes> {
		return this.categoryService.updateSubcategory(id, dto, request);
	}

	@Put('moveSubcategory/:id')
	@UseInterceptors(MoveSubcategoryInterceptor)
	moveSubcategory(@Param('id', ValidateUUID) id: string, @Body() dto: MoveSubcategoryDto, @Req() request: CategoryRequest): Promise<MoveSubcategoryRes> {
		return this.categoryService.moveSubcategory(id, dto, request);
	}

	@Get('findCategoryProducts/:id')
	findCategoryProducts(
		@Param('id', ValidateUUID) id: string,
		@Query(new QueryParamsErrorsPipe(FindCategoryProductsQueryDto))
		query: unknown
	): Promise<FindCategoryProductsRes> {
		return this.categoryService.findCategoryProducts(id, query as FindCategoryProductsQueryDto);
	}

	@Get('getCategoriesWithSubcategories')
	getCategoriesWithSubcategories(): Promise<GetCategoriesWithSubcategoriesRes> {
		return this.categoryService.getCategoriesWithSubcategories();
	}

	@Get('get_categories_by_select')
	get_categories_by_select(): Promise<GetCategoriesSelectRes> {
		return this.categoryService.get_categories_by_select();
	}

	@Get('get_subcat_by_select')
	get_subcat_by_select(): Promise<GetCategorySubcategorySelectionRes> {
		return this.categoryService.get_subcat_by_select();
	}

	@Get('getSubcategoriesByCategorySelect/:id')
	getSubcategoriesByCategorySelect(@Param('id', ValidateUUID) id: string): Promise<GetSubcategoriesByCategorySelect> {
		return this.categoryService.getSubcategoriesByCategorySelect(id);
	}

	@Post('moveProductsToSubcategory')
	@UseInterceptors(UpdateCatSubcatProductsInterceptor)
	moveProductsToSubcategory(@Body() dto: UpdateCatSubcatProductsDto, @Req() request: CategoryRequest): Promise<MoveProductsToSubcategoryRes> {
		return this.categoryService.moveProductsToSubcategory(dto, request);
	}
}
