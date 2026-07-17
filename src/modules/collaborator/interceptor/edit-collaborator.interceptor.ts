import { Injectable } from '@nestjs/common';
import { EditCollaboratorDto } from '../dto/edit-collaborator.dto';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { CollaboratorService } from '../collaborator.service';
import { CollaboratorValidator } from '../validators/collaborator.validator';

@Injectable()
export class EditCollaboratorInterceptor extends BaseValidationInterceptor<EditCollaboratorDto> {
	constructor(private readonly collaboratorValidator: CollaboratorValidator) {
		super();
	}

	protected getDtoClass() {
		return EditCollaboratorDto;
	}

	protected async validateBody(body: any): Promise<{ field: string; message: string }[]> {
		console.log('EditCollaboratorInterceptor', body);

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

			if (isEmailExist && isEmailExist.id != body.id) {
				messages.push({
					msm: 'Ya existe una cuenta con ese correo.',
					field: 'email',
				});
			}
		}

		if (body.number_document) {
			const isDocumentNumberExist = await this.collaboratorValidator.existsDocumentNumberCollaborator(body.number_document);

			if (isDocumentNumberExist && isDocumentNumberExist.id != body.id) {
				messages.push({
					msm: 'Ya existe una cuenta con ese numero de documento.',
					field: 'number_document',
				});
			}
		}

		if (body.phone) {
			const isPhoneExist = await this.collaboratorValidator.existsPhoneCollaborator(body.phone);

			if (isPhoneExist && isPhoneExist.id != body.id) {
				messages.push({
					msm: 'Ya existe una cuenta con ese numero de telefono.',
					field: 'phone',
				});
			}
		}

		return messages;
	}
}
