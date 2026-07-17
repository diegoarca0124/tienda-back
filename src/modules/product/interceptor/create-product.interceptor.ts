import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { validateSvg } from '@/common/utils/validate-svg.util';
import { validateUrl } from '@/common/utils/validate-url.util';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductService } from '../product.service';
import { ProductValidator } from '../validators/product.validator';

@Injectable()
export class CreateProductInterceptor extends BaseValidationInterceptor<CreateProductDto> {
	constructor(private readonly productValidator: ProductValidator) {
		super();
	}

	protected getDtoClass() {
		return CreateProductDto;
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

	private async validateFieldsExist(body: any): Promise<{ msm: string; field: string }[]> {
		const messages: { msm: string; field: string }[] = [];

		if (body.name) {
			const isNameExist = await this.productValidator.existsNameProduct(body.name);
			if (isNameExist) {
				messages.push({
					msm: 'Ya existe un producto con ese nombre.',
					field: 'name',
				});
			}
		}

		if (body.brandId) {
			const isBrandExist = await this.productValidator.existsBrand(body.brandId);
			if (!isBrandExist) {
				messages.push({
					msm: 'La marca seleccionada no fue encontrada.',
					field: 'brandId',
				});
			}
		}

		if (body.categoryId) {
			const isCategoryExist = await this.productValidator.existsCategory(body.categoryId);
			if (!isCategoryExist) {
				messages.push({
					msm: 'La categoría seleccionada no fue encontrada.',
					field: 'categoryId',
				});
			}
		}

		if (body.subcategoryId) {
			const isSubcategoryExist = await this.productValidator.existsSubcategory(body.subcategoryId);
			if (!isSubcategoryExist) {
				messages.push({
					msm: 'La subcategoría seleccionada no fue encontrada.',
					field: 'subcategoryId',
				});
			}
		}

		if (body.productGroupId) {
			const isProductGroupExist = await this.productValidator.existsProductGroup(body.productGroupId);
			if (isProductGroupExist) {
				messages.push({
					msm: 'El grupo seleccionado no fue encontrado.',
					field: 'productGroupId',
				});
			}
		}

		return messages;
	}
}
