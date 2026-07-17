import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { CollaboratorService } from '../collaborator.service';
import { CollaboratorValidator } from '../validators/collaborator.validator';

@Injectable()
export class LoginInterceptor extends BaseValidationInterceptor<LoginDto> {
	constructor(private readonly collaboratorValidator: CollaboratorValidator) {
		super();
	}

	protected getDtoClass() {
		return LoginDto;
	}

	protected async validateBody(body: any): Promise<{ field: string; message: string }[]> {
		const customErrors: { field: string; message: string }[] = [];

		const emailErrors = await this.validateEmailExist(body);
		emailErrors.forEach((msg) => {
			customErrors.push({ field: 'email', message: msg });
		});

		return customErrors;
	}

	protected async validateFiles(files: any): Promise<{ field: string; message: string }[]> {
		return [];
	}

	private async validateEmailExist(body: any): Promise<string[]> {
		const messages: string[] = [];

		if (body.email) {
			const isEmailTaken = await this.collaboratorValidator.existsEmailCollaborator(body.email);
			if (!isEmailTaken) {
				messages.push('El correo electrónico no fué encontrado.');
			}
		}

		return messages;
	}
}
