import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { UpdateAttributeGroupsStatusDto } from '../dto/update-attribute-groups-status.dto';

@Injectable()
export class UpdateStatusGroupAttributesInterceptor extends BaseValidationInterceptor<UpdateAttributeGroupsStatusDto> {
	constructor() {
		super();
	}

	protected getDtoClass() {
		return UpdateAttributeGroupsStatusDto;
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
		return [];
	}
}
