import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { ExportCollaboratorsDto } from '../dto/export-colllaborators.dto';

@Injectable()
export class ExportCollaboratorsInterceptor extends BaseValidationInterceptor<ExportCollaboratorsDto> {
	constructor() {
		super();
	}

	protected getDtoClass() {
		return ExportCollaboratorsDto;
	}

	protected async validateBody(body: any): Promise<{ field: string; message: string }[]> {
		console.log('interceptor', body);

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
