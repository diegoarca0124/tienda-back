import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryService } from '../category.service';
import { sanitizeSvg } from '@/common/utils/validate-svg.util';
import { EditCategoryDto } from '../dto/edit-category.dto';
import { EditSubcategoryDto } from '../dto/edit-subcategory.dto';
import { CategoryValidator } from '../validators/category.validator';

@Injectable()
export class EditSubcategoryInterceptor extends BaseValidationInterceptor<EditSubcategoryDto> {
	constructor(private readonly categoryValidator: CategoryValidator) {
		super();
	}

	protected getDtoClass() {
		return EditSubcategoryDto;
	}

	protected async validateBody(body: any, request: any): Promise<{ field: string; message: string }[]> {
		const customErrors: { field: string; message: string }[] = [];

		const fieldsErrors = await this.validateFieldsExist(body, request);
		fieldsErrors.forEach((item) => {
			customErrors.push({ field: item.field, message: item.msm });
		});

		return customErrors;
	}

	protected async validateFiles(files: any): Promise<{ field: string; message: string }[]> {
		return [];
	}

	private async validateFieldsExist(body: any, request: any): Promise<{ msm: string; field: string }[]> {
		const messages: { msm: string; field: string }[] = [];
		const subcategoryId = request.params.id;

		if (body.icon) {
					const result = sanitizeSvg(body.icon);
		
					if (!result.valid) {
						messages.push({
							msm: result.reason || 'Error en el formato del icono.',
							field: 'icon',
						});
					} else {
						body.icon = result.sanitized;
					}
				}
		

		if (body.name) {
			const isNameExist = await this.categoryValidator.existsNameSubcategory(body.name);

			if (isNameExist && isNameExist.id != subcategoryId) {
				messages.push({
					msm: 'Ya existe una subcategoría con ese nombre.',
					field: 'name',
				});
			}
		}

		if (body.prefix) {
			const isPrefixExist = await this.categoryValidator.existsPrefixSubcategory(body.prefix);

			if (isPrefixExist && isPrefixExist.id != subcategoryId) {
				messages.push({
					msm: 'Ya existe una subcategoría con ese prefijo.',
					field: 'prefix',
				});
			}
		}

		return messages;
	}
}
