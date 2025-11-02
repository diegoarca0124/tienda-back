import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Query,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
	UsePipes,
} from '@nestjs/common';
import { FileUploadInterceptor } from './interceptor/files-create-brand.interceptor';
import { CreateBrandInterceptor } from './interceptor/create-brand.interceptor';
import { CreateBrandDto } from './dto/create-brand.dto';
import { awsProcessImage } from '@/common/utils/aws-process-image.util';
import { ParseCountryPipe } from './pipes/parse-country.pipe';
import { BrandService } from './brand.service';
import { EditBrandInterceptor } from './interceptor/edit-brand.interceptor';
import { EditBrandDto } from './dto/edit-brand-dto';
import { extractFileNameImage } from '@/common/utils/extract-filename-image.util';
import { ValidateUUID } from '@/common/pipes/validate-uuid.pipe';
import { AuthGuard } from '@/common/guards/auth/auth.guard';

@Controller('brand')
export class BrandController {
	constructor(private brandService: BrandService) {}

	@Post('create_brand')
	@UseGuards(AuthGuard)
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), CreateBrandInterceptor)
	async create_brand(
		@UploadedFiles() files: { logoUrl?: Express.Multer.File[]; bannerUrl?: Express.Multer.File[] },
		@Body() createBrandDto: CreateBrandDto
	) {
		if (files) {
			if (files.logoUrl) {
				const processedLogo = await awsProcessImage(files.logoUrl[0], 'brands', 0.7);
				console.log('processedLogo', processedLogo);
				createBrandDto.logoUrl = processedLogo;
			}

			if (files.bannerUrl) {
				const processedBanner = await awsProcessImage(files.bannerUrl[0], 'brands', 0.7);
				console.log('processedBanner', processedBanner);
				createBrandDto.bannerUrl = processedBanner;
			}
		}
		return this.brandService.create_brand(createBrandDto);
	}

	@Get('get_brands')
	@UseGuards(AuthGuard)
	get_brands(@Query() query: { filter: string; page: number; limit: number; status: string }) {
		return this.brandService.get_brands(query);
	}

	@Put('update_status_brand/:id')
	@UseGuards(AuthGuard)
	update_status_brand(@Param('id', ValidateUUID) id: string, @Body() data: { status: boolean }, @Req() request: any) {
		return this.brandService.update_status_brand(id, data.status);
	}

	@Get('get_brand/:id')
	@UseGuards(AuthGuard)
	get_brand(@Param('id', ValidateUUID) id) {
		return this.brandService.get_brand(id);
	}

	@Put('update_brand/:id')
	@UseGuards(AuthGuard)
	@UseInterceptors(FileUploadInterceptor.fileInterceptor(), EditBrandInterceptor)
	async update_brand(
		@UploadedFiles() files: { logoUrl?: Express.Multer.File[]; bannerUrl?: Express.Multer.File[] },
		@Body() editBrandDto: EditBrandDto,
		@Param('id', ValidateUUID) id
	) {
		const [fileNameLogo, fileNameBanner] = await Promise.all([
			files?.logoUrl?.[0] ? this.brandService.get_brand_logo_filename_by_id(id) : Promise.resolve(null),
			files?.bannerUrl?.[0] ? this.brandService.get_brand_banner_filename_by_id(id) : Promise.resolve(null),
		]);

		const [processedLogo, processedBanner] = await Promise.all([
			files?.logoUrl?.[0]
				? awsProcessImage(files.logoUrl[0], 'brands', 0.7, fileNameLogo && extractFileNameImage(fileNameLogo))
				: Promise.resolve(undefined),
			files?.bannerUrl?.[0]
				? awsProcessImage(files.bannerUrl[0], 'brands', 0.7, fileNameBanner && extractFileNameImage(fileNameBanner))
				: Promise.resolve(undefined),
		]);

		if (processedLogo) editBrandDto.logoUrl = processedLogo;
		if (processedBanner) editBrandDto.bannerUrl = processedBanner;
		return this.brandService.update_brand(id, editBrandDto);
	}

	@Get('get_brands_by_select')
	@UseGuards(AuthGuard)
	get_brands_by_select() {
		return this.brandService.get_brands_by_select();
	}
}
