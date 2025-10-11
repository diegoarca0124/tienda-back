import { Injectable } from '@nestjs/common';
import { CreateCollaboratorDto } from '../dto/create-collaborator.dto';
import { CollaboratorService } from '../collaborator.service';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';

@Injectable()
export class CreateCollaboratorInterceptor extends BaseValidationInterceptor<CreateCollaboratorDto> {
	constructor(private readonly collaboratorService: CollaboratorService) {
		super();
	}

	protected getDtoClass() {
		return CreateCollaboratorDto;
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

		if (body.email) {
			const isEmailTaken = await this.collaboratorService.validate_email_collaborator(body.email);
			if (isEmailTaken?.id != body.id) {
				if (isEmailTaken) {
					messages.push({
						msm: 'El correo no esta disponible, intente con otro.',
						field: 'email',
					});
				}
			}
		}

		if (body.number_document) {
			const isNumberDocumentTaken = await this.collaboratorService.validate_dni_collaborator(body.number_document);
			if (isNumberDocumentTaken?.id != body.id) {
				if (isNumberDocumentTaken) {
					messages.push({
						msm: 'El numero de documento no esta disponible, intente con otro.',
						field: 'number_document',
					});
				}
			}
		}

		return messages;
	}
}
