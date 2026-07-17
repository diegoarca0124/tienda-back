import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { AttributeService } from '../attribute.service';
import { CreateAttributeValueDto } from '../dto/create-attribute-value.dto';
import { AttributeValidator } from '../validators/attribute.validator';

@Injectable()
export class CreateAttributeValueInterceptor extends BaseValidationInterceptor<CreateAttributeValueDto> {
	constructor(private readonly attributeValidator: AttributeValidator) {
		super();
	}

	protected getDtoClass() {
		return CreateAttributeValueDto;
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

		if (body.value && body.attributeId) {
			const existsValue = await this.attributeValidator.existsValueInAttribute(body.value, body.attributeId);
			if (existsValue) {
				messages.push({
					msm: 'El valor ya existe para este atributo.',
					field: 'value',
				});
			}
		}

		return messages;
	}
}
