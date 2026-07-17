import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CollaboratorService } from '../collaborator.service';
import { ValidateImportCollaboratorDto, ValidateImportCollaboratorsDto } from '../dto/validate-import-collaborators.dto';
import { CreateCollaboratorDto } from '../dto/create-collaborator.dto';
import { CollaboratorValidator } from '../validators/collaborator.validator';

@Injectable()
export class ValidateImportCollaboratorsInterceptor extends BaseValidationInterceptor<ValidateImportCollaboratorsDto> {
	constructor(private readonly collaboratorValidator: CollaboratorValidator) {
		super();
	}

	protected getDtoClass() {
		return ValidateImportCollaboratorsDto;
	}

	protected async validateBody(body: any): Promise<{ field: string; message: any }[]> {
		const result: any = [];

		if (!Array.isArray(body.data)) {
			return [{ field: 'data', message: ['Debe enviar un arreglo válido.'] }];
		}

		const REQUIRED_FIELDS = ValidateImportCollaboratorDto.REQUIRED_FIELDS;
		const receivedFields = new Set<string>();
		for (const row of body.data) {
			Object.keys(row).forEach((key) => receivedFields.add(key));
		}
		const missingColumns = REQUIRED_FIELDS.filter((field) => !receivedFields.has(field));

		for (let i = 0; i < body.data.length; i++) {
			const raw = body.data[i];
			const dto = plainToInstance(ValidateImportCollaboratorDto, {
				...raw,
			});

			const validationErrors = await validate(dto, {
				whitelist: true,
				forbidUnknownValues: false,
				skipMissingProperties: false,
			});

			const rowError: Record<string, string[]> = {};

			for (const err of validationErrors) {
				const field = err.property;
				if (!rowError[field]) {
					rowError[field] = [];
				}
				for (const msg of Object.values(err.constraints || {})) {
					rowError[field].push(msg);
				}
			}

			if (body.mode == 'news') {
				if (dto.email) {
					const isEmailExist = await this.collaboratorValidator.existsEmailCollaborator(dto.email);

					if (isEmailExist) {
						if (!rowError.email) rowError.email = [];
						rowError.email.push('El correo ya se encuentra registrado.');
					}
				}

				if (dto.number_document) {
					const isDocumentNumberExist = await this.collaboratorValidator.existsDocumentNumberCollaborator(dto.number_document);
					console.log('isDocumentNumberExist', isDocumentNumberExist);

					if (isDocumentNumberExist) {
						if (!rowError.number_document) rowError.number_document = [];
						rowError.number_document.push('El número de documento ya se encuentra registrado.');
					}
				}
			}

			if (Object.keys(rowError).length > 0) {
				result.push({
					[i]: rowError,
				});
			}
		}

		if (result.length > 0 || missingColumns.length > 0) {
			return [
				{
					field: 'data',
					message: result,
				},
				{
					field: 'missing_columns',
					message: missingColumns,
				},
				{
					field: 'total',
					message: body.data.length,
				},
				{
					field: 'errors',
					message: result.length,
				},
			];
		}

		return [];
	}

	protected async validateFiles(): Promise<{ field: string; message: string }[]> {
		return [];
	}
}
