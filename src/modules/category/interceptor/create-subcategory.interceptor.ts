import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryService } from '../category.service';
import { validateSvg } from '@/common/utils/validate-svg.util';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { CategoryValidator } from '../validators/category.validator';

@Injectable()
export class CreateSubcategoryInterceptor extends BaseValidationInterceptor<CreateSubcategoryDto> {
	constructor(private readonly categoryValidator: CategoryValidator) {
		super();
	}

	protected getDtoClass() {
		return CreateSubcategoryDto;
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
		return [];
	}

	private async validateFieldsExist(body: any): Promise<{ msm: string; field: string }[]> {
		const messages: { msm: string; field: string }[] = [];

		if (body.icon) {
			const resValidateIcon = validateSvg(body.icon);
			if (!resValidateIcon.valid) {
				messages.push({
					msm: resValidateIcon.reason || 'Error en el formato del icono.',
					field: 'icon',
				});
			}
		}

		if (body.name) {
			const isNameExist = await this.categoryValidator.existsNameSubcategory(body.name);

			if (isNameExist) {
				messages.push({
					msm: 'Ya existe una subcategoría con ese nombre.',
					field: 'name',
				});
			}
		}

		if (body.prefix) {
			const isPrefixExist = await this.categoryValidator.existsPrefixSubcategory(body.prefix);

			if (isPrefixExist) {
				messages.push({
					msm: 'Ya existe una subcategoría con ese prefijo.',
					field: 'prefix',
				});
			}
		}

		return messages;
	}
}
