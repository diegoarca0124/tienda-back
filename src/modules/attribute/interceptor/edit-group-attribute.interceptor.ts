import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';

import { AttributeValidator } from '../validators/attribute.validator';
import { isUUID } from 'class-validator';
import { EditGroupAttributeDto } from '../dto/edit-group-attribute.dto';

@Injectable()
export class EditAttributeGroupInterceptor extends BaseValidationInterceptor<EditGroupAttributeDto> {
	constructor(private readonly attributeValidator: AttributeValidator) {
		super();
	}

	protected getDtoClass() {
		return EditGroupAttributeDto;
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
		if (typeof body.name === 'string' && body.name.trim() && isUUID(request.params.id, '4')) {
			const isNameExist = await this.attributeValidator.existsNameGroupAttribute(body.name, request.params.id);
			if (isNameExist) messages.push({ msm: 'Ya existe un grupo de atributos con ese nombre.', field: 'name' });
		}
		if (Array.isArray(body.categories) && body.categories.length && body.categories.every((id) => isUUID(id, '4'))) {
			const categoriesExist = await this.attributeValidator.existsAllCategories(body.categories);
			if (!categoriesExist) messages.push({ msm: 'Una o más categorías seleccionadas no existen.', field: 'categories' });
		}
		return messages;
	}
}
