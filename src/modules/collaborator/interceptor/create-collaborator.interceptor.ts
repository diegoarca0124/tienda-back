import { Injectable } from '@nestjs/common';
import { CreateCollaboratorDto } from '../dto/create-collaborator.dto';
import { CollaboratorService } from '../collaborator.service';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CollaboratorValidator } from '../validators/collaborator.validator';

@Injectable()
export class CreateCollaboratorInterceptor extends BaseValidationInterceptor<CreateCollaboratorDto> {
	constructor(private readonly collaboratorValidator: CollaboratorValidator) {
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
			const isEmailExist = await this.collaboratorValidator.existsEmailCollaborator(body.email);

			if (isEmailExist) {
				messages.push({
					msm: 'Ya existe una cuenta con ese correo.',
					field: 'email',
				});
			}
		}

		if (body.number_document) {
			const isDocumentNumberExist = await this.collaboratorValidator.existsDocumentNumberCollaborator(body.number_document);

			if (isDocumentNumberExist) {
				messages.push({
					msm: 'Ya existe una cuenta con ese numero de documento.',
					field: 'number_document',
				});
			}
		}

		if (body.phone) {
			const isPhoneExist = await this.collaboratorValidator.existsPhoneCollaborator(body.phone);

			if (isPhoneExist) {
				messages.push({
					msm: 'Ya existe una cuenta con ese numero de telefono.',
					field: 'phone',
				});
			}
		}

		return messages;
	}
}
