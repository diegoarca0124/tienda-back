import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { UpdateCollaboratorsStatusDto } from '../dto/update-collaborators-status.dto';

@Injectable()
export class UpdateStatusCollaboratorsInterceptor extends BaseValidationInterceptor<UpdateCollaboratorsStatusDto> {
	constructor() {
		super();
	}

	protected getDtoClass() {
		return UpdateCollaboratorsStatusDto;
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
