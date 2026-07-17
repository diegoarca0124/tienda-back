import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { ProductService } from '../product.service';
import { UploadImagesProductProductDto } from '../dto/upload-images-product.dto';

@Injectable()
export class UploadImagesProductInterceptor extends BaseValidationInterceptor<UploadImagesProductProductDto> {
	constructor(private readonly productService: ProductService) {
		super();
	}

	protected getDtoClass() {
		return UploadImagesProductProductDto;
	}

	protected async validateBody(body: any): Promise<{ field: string; message: string }[]> {
		const customErrors: { field: string; message: string }[] = [];

		const fieldsErrors = await this.validateFieldsExist(body);
		fieldsErrors.forEach((item) => {
			customErrors.push({ field: item.field, message: item.msm });
		});

		return customErrors;
	}

	protected async validateFiles(files: any): Promise<{ field: string; message: string }[]> {
		const customErrors: { field: string; message: string }[] = [];
		const imageImages = await this.validateImages(files);
		imageImages.forEach((item) => {
			customErrors.push({ field: item.field, message: item.msm });
		});

		return customErrors;
	}

	private async validateFieldsExist(body: any): Promise<{ msm: string; field: string }[]> {
		return [];
	}

	private async validateImages(files?: { [key: string]: Express.Multer.File[] }): Promise<{ msm: string; field: string }[]> {
		const messages: { msm: string; field: string }[] = [];
		const maxSize = 3 * 1024 * 1024; // 3 MB

		const fields = [{ name: 'gallery', label: 'galería' }];

		fields.forEach(({ name, label }) => {
			const fieldFiles = files?.[name];

			if (!fieldFiles || fieldFiles.length === 0) {
				messages.push({ msm: `El campo ${label} es requerido.`, field: name });
				return;
			}

			if (files?.['gallery']?.length < 1) {
				messages.push({ msm: `La galería necesita minimo 1 imagen.`, field: name });
				return;
			}

			fieldFiles.forEach((file) => {
				if (!file.mimetype.startsWith('image/')) {
					messages.push({ msm: `El campo ${label} debe ser formato de imagen.`, field: name });
				}
				if (file.size > maxSize) {
					messages.push({ msm: `El campo ${label} no puede superar los 3MB de peso.`, field: name });
				}
			});
		});

		return messages;
	}
}
