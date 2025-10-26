import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateCategoryInterceptor } from './interceptor/create-category.interceptor';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from '@/entities/category.entity';
import { CategoryService } from './category.service';
import { EditCategoryInterceptor } from './interceptor/edit-category.interceptor';
import { EditCategoryDto } from './dto/edit-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { CreateSubcategoryInterceptor } from './interceptor/create-subcategory.interceptor';
import { Subcategory } from '@/entities/subcategory.entity';
import { EditSubcategoryDto } from './dto/edit-subcategory.dto';
import { EditSubcategoryInterceptor } from './interceptor/edit-subcategory.interceptor';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { AuthGuard } from '@/common/guards/auth/auth.guard';

@Controller('category')
export class CategoryController {
	constructor(private categoryService: CategoryService) {}

	@Post('create_category')
	@UseGuards(AuthGuard)
	@UseInterceptors(CreateCategoryInterceptor)
	create_category(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
		return this.categoryService.create_category(createCategoryDto);
	}

	@Get('get_categories')
	@UseGuards(AuthGuard)
	get_categories(@Query() query: { filter: string; page: number; limit: number; status: string }) {
		return this.categoryService.get_categories(query);
	}

	@Put('update_status_category/:id')
	@UseGuards(AuthGuard)
	update_status_category(@Param('id') id: string, @Body() data: { status: boolean }) {
		return this.categoryService.update_status_category(id, data.status);
	}

	@Get('get_category/:id')
	@UseGuards(AuthGuard)
	get_category(@Param('id') id) {
		return this.categoryService.get_category(id);
	}

	@Put('update_category/:id')
	@UseGuards(AuthGuard)
	@UseInterceptors(EditCategoryInterceptor)
	update_category(@Param('id', ValidateUUID) id: string, @Body() editCategoryDto: EditCategoryDto) {
		return this.categoryService.update_category(id, editCategoryDto);
	}

	@Post('create_subcategory')
	@UseGuards(AuthGuard)
	@UseInterceptors(CreateSubcategoryInterceptor)
	create_subcategory(@Body() createSubcategoryDto: CreateSubcategoryDto): Promise<Subcategory> {
		return this.categoryService.create_subcategory(createSubcategoryDto);
	}

	@Get('get_subcategories/:id')
	@UseGuards(AuthGuard)
	get_subcategories(@Param('id', ValidateUUID) id: string) {
		return this.categoryService.get_subcategories(id);
	}

	@Put('update_status_subcategory/:id')
	@UseGuards(AuthGuard)
	update_status_subcategory(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }) {
		return this.categoryService.update_status_subcategory(id, data.status);
	}

	@Put('update_subcategory/:id')
	@UseGuards(AuthGuard)
	@UseInterceptors(EditSubcategoryInterceptor)
	update_subcategory(@Param('id', ValidateUUID) id: string, @Body() editSubcategoryDto: EditSubcategoryDto) {
		return this.categoryService.update_subcategory(id, editSubcategoryDto);
	}

	@Get('get_categories_by_select')
	@UseGuards(AuthGuard)
	get_categories_by_select() {
		return this.categoryService.get_categories_by_select();
	}

	@Get('get_subcategories_by_select/:id')
	@UseGuards(AuthGuard)
	get_subcategories_by_select(@Param('id', ValidateUUID) id: string) {
		return this.categoryService.get_subcategories_by_select(id);
	}
	
}
