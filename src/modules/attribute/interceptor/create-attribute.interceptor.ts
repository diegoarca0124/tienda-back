import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { AttributeValidator } from '../validators/attribute.validator';
import { isUUID } from 'class-validator';

@Injectable()
export class CreateAttributeInterceptor extends BaseValidationInterceptor<CreateAttributeDto> {
	constructor(private readonly attributeValidator: AttributeValidator) {
		super();
	}

	protected getDtoClass() {
		return CreateAttributeDto;
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

		if (typeof body.name === 'string' && body.name && isUUID(body.attributeGroupId, '4')) {
			const isNameExist = await this.attributeValidator.validateAttributeNameNotExists(body.name, body.attributeGroupId);

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
