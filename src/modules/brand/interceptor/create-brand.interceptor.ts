import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { validateSvg } from '@/common/utils/validate-svg.util';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { BrandService } from '../brand.service';
import { validateUrl } from '@/common/utils/validate-url.util';
import { BrandValidator } from '../validators/brand.validator';

@Injectable()
export class CreateBrandInterceptor extends BaseValidationInterceptor<CreateBrandDto> {
	constructor(
		private readonly brandService: BrandService,
		private readonly brandValidator: BrandValidator
	) {
		super();
	}

	protected getDtoClass() {
		return CreateBrandDto;
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

		const fields = [
			{ name: 'logoUrl', label: 'logo' },
			{ name: 'bannerUrl', label: 'banner' },
		];

		fields.forEach(({ name, label }) => {
			const fieldFiles = files?.[name];

			if (!fieldFiles || fieldFiles.length === 0) {
				messages.push({ msm: `El ${label} es requerido.`, field: name });
				return;
			}

			fieldFiles.forEach((file) => {
				if (!file.mimetype.startsWith('image/')) {
					messages.push({ msm: `El ${label} debe ser formato de imagen.`, field: name });
				}
				if (file.size > maxSize) {
					messages.push({ msm: `El ${label} no puede superar los 3MB de peso.`, field: name });
				}
			});
		});
		return messages;
	}

	private async validateFieldsExist(body: any): Promise<{ msm: string; field: string }[]> {
		const messages: { msm: string; field: string }[] = [];

		if (body.name) {
			const isNameExist = await this.brandValidator.existsNameBrand(body.name);

			if (isNameExist) {
				messages.push({
					msm: 'Ya existe una marca con ese nombre.',
					field: 'name',
				});
			}
		}

		if (body.prefix) {
			const isPrefixExist = await this.brandValidator.existsPrefixBrand(body.prefix);

			if (isPrefixExist) {
				messages.push({
					msm: 'Ya existe una marca con ese prefijo.',
					field: 'prefix',
				});
			}
		}

		if (body.websiteUrl) {
			const isUrlValid = validateUrl(body.websiteUrl);
			if (!isUrlValid) {
				messages.push({
					msm: 'La url del sitio no es valida.',
					field: 'websiteUrl',
				});
			}
		}

		return messages;
	}
}
