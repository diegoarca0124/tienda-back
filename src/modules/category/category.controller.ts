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
import { UpdateCategoryInSubcategoryDto } from './dto/update-category-in-subcategory.dto';
import { UpdateCategoryInSubcategoryInterceptor } from './interceptor/update-category-in-subcategory.interceptor';
import { FindCategoryProductsQueryDto } from './dto/find-category-products.dto';

@Controller('category')
export class CategoryController {
	constructor(private categoryService: CategoryService) {}

	@Post('create_category')
	@UseInterceptors(CreateCategoryInterceptor)
	create_category(@Body() createCategoryDto: CreateCategoryDto, @Req() request): Promise<{ data: Category; message: string }> {
		return this.categoryService.create_category(createCategoryDto, request);
	}

	@Get('get_categories')
	get_categories(@Query() query: { filter: string; page: number; limit: number; status: string; sort: string, configuration: string }) {
		return this.categoryService.get_categories(query);
	}

	@Put('update_status_category/:id')
	update_status_category(@Param('id') id: string, @Body() data: { status: boolean }, @Req() request) {
		return this.categoryService.update_status_category(id, data.status, request);
	}

	@Get('get_category/:id')
	get_category(@Param('id') id) {
		return this.categoryService.get_category(id);
	}

	@Put('update_category/:id')
	@UseInterceptors(EditCategoryInterceptor)
	update_category(@Param('id', ValidateUUID) id: string, @Body() editCategoryDto: EditCategoryDto, @Req() request) {
		return this.categoryService.update_category(id, editCategoryDto, request);
	}

	@Post('create_subcategory')
	@UseInterceptors(CreateSubcategoryInterceptor)
	create_subcategory(@Body() createSubcategoryDto: CreateSubcategoryDto, @Req() request): Promise<{ data: Subcategory; message: string }> {
		return this.categoryService.create_subcategory(createSubcategoryDto, request);
	}

	@Get('get_subcategories/:id')
	get_subcategories(@Param('id', ValidateUUID) id: string) {
		return this.categoryService.get_subcategories(id);
	}

	@Put('update_status_subcategory/:id')
	update_status_subcategory(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request) {
		return this.categoryService.update_status_subcategory(id, data.status, request);
	}

	@Put('update_subcategory/:id')
	@UseInterceptors(EditSubcategoryInterceptor)
	update_subcategory(@Param('id', ValidateUUID) id: string, @Body() editSubcategoryDto: EditSubcategoryDto, @Req() request) {
		return this.categoryService.update_subcategory(id, editSubcategoryDto, request);
	}

	@Get('findCategoryProducts/:id')
	findCategoryProducts(
		@Param('id', ValidateUUID) id: string, 
		@Query() query: FindCategoryProductsQueryDto
	) {
		console.log('query',query);
		return this.categoryService.findCategoryProducts(id, query);
	}

	@Get('get_categories_with_subcategories')
	get_categories_with_subcategories() {
		return this.categoryService.get_categories_with_subcategories();
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

	@Post('update_status_categories')
	@UseInterceptors(UpdateStatusCategoriesInterceptor)
	update_status_categories(@Body() updateStatusCategoriesDto: UpdateStatusCategoriesDto, @Req() request) {
		return this.categoryService.update_status_categories(updateStatusCategoriesDto, request);
	}

	@Post('update_status_subcategories')
	@UseInterceptors(UpdateStatusSubcategoriesInterceptor)
	update_status_subcategories(@Body() updateStatusSubcategoriesDto: UpdateStatusSubcategoriesDto, @Req() request) {
		return this.categoryService.update_status_subcategories(updateStatusSubcategoriesDto, request);
	}

	@Post('update_catsubcat_products')
	@UseInterceptors(UpdateCatSubcatProductsInterceptor)
	update_catsubcat_products(@Body() updateCatSubcatProductsDto: UpdateCatSubcatProductsDto, @Req() request): Promise<{ data: any; message: string }> {
		return this.categoryService.update_catsubcat_products(updateCatSubcatProductsDto, request);
	}

	@Put('update_category_in_subcategory/:id')
	@UseInterceptors(UpdateCategoryInSubcategoryInterceptor)
	update_category_in_subcategory(@Param('id', ValidateUUID) id: string, @Body() updateCategoryInSubcategoryDto: UpdateCategoryInSubcategoryDto, @Req() request) {
		return this.categoryService.update_category_in_subcategory(id, updateCategoryInSubcategoryDto, request);
	}
}
