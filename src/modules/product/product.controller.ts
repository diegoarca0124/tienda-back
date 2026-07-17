import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateProductInterceptor } from './interceptor/create-product.interceptor';
import { CreateBrandDto } from '../brand/dto/create-brand.dto';
import { awsProcessImage } from '@/common/utils/aws-process-image.util';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { FileUploadInterceptor } from './interceptor/files-create-product.interceptor';
import { awsProcessImages } from '@/common/utils/aws-process-images.util';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { EditProductDescriptionInterceptor } from './interceptor/edit-product-description.interceptor';
import { CreateProductDescriptionInterceptor } from './interceptor/create-product-description.interceptor';
import { CreateProductDescriptiomDto } from './dto/create-product-description.dto';
import { UploadImagesProductInterceptor } from './interceptor/upload-images-product.interceptor';
import { UploadImagesProductProductDto } from './dto/upload-images-product.dto';
import { SetCoverProductInterceptor } from './interceptor/set-cover-product.interceptor';
import { SetCoverProductDto } from './dto/set-cover-product.dto';
import { CreateVariationProductInterceptor } from './interceptor/create-variation-product.interceptor';
import { CreateVariationProductDto } from './dto/create-variation-product.dt';
import { UpdateNameVariationDto } from './dto/update-name-variation.dto';
import { UpdateNameVariationInterceptor } from './interceptor/update-name-variation.interceptor';
import { EditProductDescriptionsDto } from './dto/edit-product-description.dto';
import { SetMiniatureProductInterceptor } from './interceptor/set-miniature-product.interceptor';
import { SetMiniatureProductDto } from './dto/set-miniature-product.dto';
import { UpdateGroupInProductDto } from './dto/update-group-in-product.dto';
import { UpdateGroupInProductInterceptor } from './interceptor/update-group-in-product.interceptor';
import { UpdateProductInterceptor } from './interceptor/update-product.interceptor';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('product')
export class ProductController {
	constructor(private productService: ProductService) {}

	@Post('create_product')
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), CreateProductInterceptor)
	async create_product(@UploadedFiles() files: { gallery?: Express.Multer.File[] }, @Body() createProductDto: CreateProductDto) {
		if (files) {
			if (files.gallery) {
				const processedGallery = await awsProcessImages(files.gallery, 'products', 0.7);
				console.log(processedGallery);

				createProductDto.cover = processedGallery.find((item) => item.originalName == createProductDto.cover)!.newName;
				createProductDto.miniature = processedGallery.find((item) => item.originalName == createProductDto.miniature)!.newName;
				createProductDto.gallery = processedGallery.map((prev) => prev.newName);
			}
		}
		return this.productService.create_product(createProductDto);
	}

	@Get('get_products')
	get_products(
		@Query()
		query: {
			filter: string;
			page: number;
			limit: number;
			status: string;
			visibility: string;
			categories: string;
			brands: string;
			countries: string;
			minPrice: number | string;
			maxPrice: number | string;
			quality: string;
		}
	) {
		return this.productService.get_products(query);
	}

	@Get('get_groups_for_create_product/:categoryId')
	get_groups_for_create_product(@Param('categoryId', ValidateUUID) categoryId, @Query() query: { filter?: string; productId?: string }) {
		return this.productService.get_groups_for_create_product(categoryId, query);
	}

	@Get('import_product_for_group/:productGroupId')
	import_product_for_group(@Param('productGroupId', ValidateUUID) productGroupId) {
		return this.productService.import_product_for_group(productGroupId);
	}

	@Get('get_product/:id')
	get_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_product(id);
	}

	@Put('update_product/:id')
	@UseInterceptors(UpdateProductInterceptor)
	update_product(
		@Param('id', ValidateUUID) id: string,
		@Body() UpdateProductDto: UpdateProductDto,
	) {
		return this.productService.update_product(
			id,
			UpdateProductDto
		);
	}

	@Post('update_product_description')
	@UseInterceptors(EditProductDescriptionInterceptor)
	update_product_description(@Body() editProductDescriptionsDto: EditProductDescriptionsDto) {
		return this.productService.update_product_description(editProductDescriptionsDto);
	}

	@Get('get_variations_product/:id')
	get_variations_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_variations_product(id);
	}

	@Post('upload_images_product')
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), UploadImagesProductInterceptor)
	async upload_images_product(@UploadedFiles() files: { gallery?: Express.Multer.File[] }, @Body() uploadImagesProductProductDto: UploadImagesProductProductDto) {
		if (files) {
			if (files.gallery) {
				const processedGallery = await awsProcessImages(files.gallery, 'products', 0.7);
				uploadImagesProductProductDto.gallery = processedGallery.map((prev) => prev.newName);
			}
		}
		return this.productService.upload_images_product(uploadImagesProductProductDto);
	}

	@Put('set_cover_product/:id')
	@UseInterceptors(SetCoverProductInterceptor)
	set_cover_product(@Param('id', ValidateUUID) id: string, @Body() setCoverProductDto: SetCoverProductDto) {
		return this.productService.set_cover_product(id, setCoverProductDto);
	}

	@Put('set_miniature_product/:id')
	@UseInterceptors(SetMiniatureProductInterceptor)
	set_miniature_product(@Param('id', ValidateUUID) id: string, @Body() setMiniatureProductDto: SetMiniatureProductDto) {
		return this.productService.set_miniature_product(id, setMiniatureProductDto);
	}

	@Delete('delete_image_product/:id')
	delete_image_product(@Param('id', ValidateUUID) id) {
		return this.productService.delete_image_product(id);
	}

	@Post('create_variation_product')
	@UseInterceptors(CreateVariationProductInterceptor)
	create_variation_product(@Body() createVariationProductDto: CreateVariationProductDto) {
		return this.productService.create_variation_product(createVariationProductDto);
	}

	@Get('get_characteristics_product/:id')
	get_characteristics_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_characteristics_product(id);
	}

	@Get('get_photos_product/:id')
	get_photos_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_photos_product(id);
	}

	@Put('update_status_variation/:id')
	update_status_variation(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }) {
		return this.productService.update_status_variation(id, data.status);
	}

	@Put('update_feature_attribute/:id')
	update_feature_attribute(
		@Param('id', ValidateUUID) id: string, 
		@Body() data: { isFeatured: boolean },
		@Req() request
	) {
		return this.productService.update_feature_attribute(id, data.isFeatured, request);
	}

	@Put('update_name_variation/:id')
	@UseInterceptors(UpdateNameVariationInterceptor)
	update_name_variation(@Param('id', ValidateUUID) id: string, @Body() updateNameVariationDto: UpdateNameVariationDto) {
		return this.productService.update_name_variation(id, updateNameVariationDto);
	}

	@Put('update_group_in_product/:id')
	@UseInterceptors(UpdateGroupInProductInterceptor)
	update_group_in_product(@Param('id', ValidateUUID) id: string, @Body() updateGroupInProductDto: UpdateGroupInProductDto) {
		return this.productService.update_group_in_product(id, updateGroupInProductDto);
	}

	@Get('find_products_to_copy/:id')
	find_products_to_copy(@Param('id', ValidateUUID) id, @Query() query: {name: string;}) {
		return this.productService.find_products_to_copy(id, query.name);
	}
}
