import { AuthGuard } from '@/common/guards/auth/auth.guard';
import { Body, Controller, Get, Param, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateProductInterceptor } from './interceptor/create-product.interceptor';
import { CreateBrandDto } from '../brand/dto/create-brand.dto';
import { awsProcessImage } from '@/common/utils/aws-process-image.util';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { FileUploadInterceptor } from './interceptor/files-create-product.interceptor';
import { awsProcessImages } from '@/common/utils/aws-process-images.util';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';

@Controller('product')
export class ProductController {
    constructor(private productService: ProductService) {}

    @Post('create_product')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileUploadInterceptor.fileInterceptor(), CreateProductInterceptor)
    async create_product(
        @UploadedFiles() files: { cover?: Express.Multer.File[]; miniature?: Express.Multer.File[], gallery?: Express.Multer.File[] },
        @Body() createProductDto: CreateProductDto
    ) {
    
        if (files) {
			if (files.cover) {
				const processedCover = await awsProcessImage(files.cover[0], 'products', 0.7);
				console.log('processedCover', processedCover);
				createProductDto.cover = processedCover;
			}

			if (files.miniature) {
				const processedMiniature = await awsProcessImage(files.miniature[0], 'products', 0.7);
				console.log('processedMiniature', processedMiniature);
				createProductDto.miniature = processedMiniature;
			}

            if (files.gallery) {
				const processedGallery = await awsProcessImages(files.gallery, 'products', 0.7);
				console.log('processedGallery', processedGallery);
				createProductDto.gallery = processedGallery;
			}
		}

        console.log('ProductController - productGroupId',createProductDto.productGroupId);
        
        return this.productService.create_product(createProductDto);
    }

    @Get('get_products')
    @UseGuards(AuthGuard)
    get_products(@Query() query: { filter: string; page: number; limit: number; status: string; visibility: string; categories: string, brands: string, countries: string, minPrice: number|string, maxPrice: number|string }) {
        return this.productService.get_products(query);
    }

    @Get('get_groups_for_create_product')
    @UseGuards(AuthGuard)
    get_groups_for_create_product(@Query() query: { filter: string}) {
        return this.productService.get_groups_for_create_product(query);
    }

    
    @Get('import_product_for_group/:productGroupId')
    @UseGuards(AuthGuard)
    import_product_for_group(@Param('productGroupId', ValidateUUID) productGroupId) {
        return this.productService.import_product_for_group(productGroupId);
    }

    
    @Get('get_product/:id')
	@UseGuards(AuthGuard)
	get_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_product(id);
	}

    @Get('get_variations_product/:id')
	@UseGuards(AuthGuard)
	get_variations_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_variations_product(id);
	}

    @Get('get_characteristics_product/:id')
	@UseGuards(AuthGuard)
	get_characteristics_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_characteristics_product(id);
	}

    @Get('get_photos_product/:id')
	@UseGuards(AuthGuard)
	get_photos_product(@Param('id', ValidateUUID) id) {
		return this.productService.get_photos_product(id);
	}
    
    
}
