import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateCategoryInterceptor } from './interceptor/create-category.interceptor';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryService } from './category.service';
import { EditCategoryInterceptor } from './interceptor/edit-category.interceptor';
import { EditCategoryDto } from './dto/edit-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { CreateSubcategoryInterceptor } from './interceptor/create-subcategory.interceptor';
import { Subcategory } from '@/entities/subcategory.entity';
import { EditSubcategoryDto } from './dto/edit-subcategory.dto';
import { EditSubcategoryInterceptor } from './interceptor/edit-subcategory.interceptor';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { UpdateStatusCategoriesInterceptor } from './interceptor/update-status-categories.interceptor';
import { UpdateStatusCategoriesDto } from './dto/update-status-categories.dto';
import { UpdateStatusSubcategoriesInterceptor } from './interceptor/update-status-subcategories.interceptor';
import { UpdateStatusSubcategoriesDto } from './dto/update-status-subcategories.dto';
import { Category } from '@/entities/category.entity';
import { UpdateCatSubcatProductsInterceptor } from './interceptor/update-catsubcat-produtcs.interceptor';
import { UpdateCatSubcatProductsDto } from './dto/update-catsubcat-products.dto';
import { MoveSubcategoryDto } from './dto/move-subcategory.dto';
import { MoveSubcategoryInterceptor } from './interceptor/move-subcategory.interceptor';
import { FindCategoryProductsQueryDto } from './dto/find-category-products.dto';
import { QueryParamsErrorsPipe } from '@/common/pipes/query-params-errors.pipe';
import { FindCategoriesQueryDto } from './dto/find-categories.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';
import { CreateCategoryRes, CreateSubcategoryRes, GetCategoriesRes, GetCategoriesWithSubcategoriesRes, GetCategoryRes, GetSubcategoriesRes, MoveSubcategoryRes, UpdateCategoryRes, UpdateSubcategoriesStatusRes, UpdateSubcategoryRes, UpdateSubcategoryStatusRes } from './interfaces/controller.interface';

@Controller('category')
export class CategoryController {
	constructor(private categoryService: CategoryService) {}

	@Post('createCategory')
	@UseInterceptors(CreateCategoryInterceptor)
	createCategory(@Body() dto: CreateCategoryDto, @Req() request): Promise<CreateCategoryRes> {
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
	updateCategoryStatus(@Param('id', ValidateUUID) id: string, @Body() dto: UpdateCategoryStatusDto, @Req() request) {
		return this.categoryService.updateCategoryStatus(id, dto, request);
	}

	@Post('updateCategoriesStatus')
	@UseInterceptors(UpdateStatusCategoriesInterceptor)
	updateCategoriesStatus(@Body() dto: UpdateStatusCategoriesDto, @Req() request) {
		return this.categoryService.updateCategoriesStatus(dto, request);
	}

	@Get('getCategory/:id')
	getCategory(@Param('id') id): Promise<GetCategoryRes> {
		return this.categoryService.getCategory(id);
	}

	@Put('updateCategory/:id')
	@UseInterceptors(EditCategoryInterceptor)
	updateCategory(@Param('id', ValidateUUID) id: string, @Body() dto: EditCategoryDto, @Req() request):Promise<UpdateCategoryRes> {
		return this.categoryService.updateCategory(id, dto, request);
	}

	@Post('createSubcategory')
	@UseInterceptors(CreateSubcategoryInterceptor)
	createSubcategory(@Body() dto: CreateSubcategoryDto, @Req() request): Promise<CreateSubcategoryRes> {
		return this.categoryService.createSubcategory(dto, request);
	}

	@Get('getSubcategories/:id')
	getSubcategories(@Param('id', ValidateUUID) id: string): Promise<GetSubcategoriesRes> {
		return this.categoryService.getSubcategories(id);
	}

	@Put('updateSubcategoryStatus/:id')
	updateSubcategoryStatus(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request): Promise<UpdateSubcategoryStatusRes> {
		return this.categoryService.updateSubcategoryStatus(id, data.status, request);
	}

	@Put('updateSubcategory/:id')
	@UseInterceptors(EditSubcategoryInterceptor)
	updateSubcategory(@Param('id', ValidateUUID) id: string, @Body() dto: EditSubcategoryDto, @Req() request): Promise<UpdateSubcategoryRes> {
		return this.categoryService.updateSubcategory(id, dto, request);
	}

	@Get('findCategoryProducts/:id')
	findCategoryProducts(
		@Param('id', ValidateUUID) id: string,
		@Query(new QueryParamsErrorsPipe(FindCategoryProductsQueryDto))
		query: unknown
	) {
		return this.categoryService.findCategoryProducts(id, query as FindCategoryProductsQueryDto);
	}

	@Get('getCategoriesWithSubcategories')
	getCategoriesWithSubcategories(): Promise<GetCategoriesWithSubcategoriesRes> {
		return this.categoryService.getCategoriesWithSubcategories();
	}

	@Get('get_categories_by_select')
	get_categories_by_select() {
		return this.categoryService.get_categories_by_select();
	}

	@Get('get_subcat_by_select')
	get_subcat_by_select() {
		return this.categoryService.get_subcat_by_select();
	}

	@Get('get_subcategories_by_select/:id')
	get_subcategories_by_select(@Param('id', ValidateUUID) id: string) {
		return this.categoryService.get_subcategories_by_select(id);
	}

	@Post('updateSubcategoriesStatus')
	@UseInterceptors(UpdateStatusSubcategoriesInterceptor)
	updateSubcategoriesStatus(@Body() dto: UpdateStatusSubcategoriesDto, @Req() request) : Promise<UpdateSubcategoriesStatusRes>{
		return this.categoryService.updateSubcategoriesStatus(dto, request);
	}

	@Post('update_catsubcat_products')
	@UseInterceptors(UpdateCatSubcatProductsInterceptor)
	update_catsubcat_products(@Body() updateCatSubcatProductsDto: UpdateCatSubcatProductsDto, @Req() request): Promise<{ data: any; message: string }> {
		return this.categoryService.update_catsubcat_products(updateCatSubcatProductsDto, request);
	}

	@Put('moveSubcategory/:id')
	@UseInterceptors(MoveSubcategoryInterceptor)
	moveSubcategory(@Param('id', ValidateUUID) id: string, @Body() dto: MoveSubcategoryDto, @Req() request): Promise<MoveSubcategoryRes> {
		return this.categoryService.moveSubcategory(id, dto, request);
	}
}
