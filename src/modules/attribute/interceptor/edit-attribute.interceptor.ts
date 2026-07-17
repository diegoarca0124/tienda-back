import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';

import { AttributeService } from '../attribute.service';
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

		if (body.name) {
			const idNameExists = await this.attributeValidator.existNameAttribute(body.name);
			if (idNameExists && idNameExists.id != body.id) {
				messages.push({
					msm: 'Ya existe un atributo con ese nombre.',
					field: 'name',
				});
			}
		}

		return messages;
	}
}
