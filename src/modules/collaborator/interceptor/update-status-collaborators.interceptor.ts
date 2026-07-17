import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { UpdateStatusCollaboratorsDto } from '../dto/update-status-collaborators.dto';

@Injectable()
export class UpdateStatusCollaboratorsInterceptor extends BaseValidationInterceptor<UpdateStatusCollaboratorsDto> {
	constructor() {
		super();
	}

	protected getDtoClass() {
		return UpdateStatusCollaboratorsDto;
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
