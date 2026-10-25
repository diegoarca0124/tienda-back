import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';

import { isUUID } from 'class-validator';
import { EditAttributeDto } from '../dto/edit-attribute.dto';
import { AttributeValidator } from '../validators/attribute.validator';

@Injectable()
export class EditAttributeInterceptor extends BaseValidationInterceptor<EditAttributeDto> {
	constructor(private readonly attributeValidator: AttributeValidator) {
		super();
	}

	protected getDtoClass() {
		return EditAttributeDto;
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
			const isNameExist = await this.attributeValidator.existsAttributeNameForUpdate(body.name, request.params.id);
			if (isNameExist) {
				messages.push({
					msm: 'Ya existe un atributo con ese nombre.',
					field: 'name',
				});
			}
		}

		return messages;
	}
}
