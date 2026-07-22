import { Injectable } from '@nestjs/common';
import { BaseValidationInterceptor } from '@/common/interceptors/base-validation.interceptor';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportCollaboratorsDto, ValidateImportCollaboratorDto } from '../dto/import-collaborators.dto';
import { CollaboratorValidator } from '../validators/collaborator.validator';

type RowErrors = Record<string, string[]>;
type ValidationResult = { field: string; message: any };
type ImportRowResult = Record<number, RowErrors>;
type DuplicateField = 'email' | 'phone' | 'number_document';

@Injectable()
export class ImportCollaboratorsInterceptor extends BaseValidationInterceptor<ImportCollaboratorsDto> {
	constructor(private readonly collaboratorValidator: CollaboratorValidator) {
		super();
	}

	protected getDtoClass() {
		return ImportCollaboratorsDto;
	}

	protected async validateBody(body: any): Promise<ValidationResult[]> {
		if (!Array.isArray(body.data)) return [{ field: 'data', message: ['Debe enviar un arreglo válido.'] }];
		const missingColumns = this.getMissingColumns(body.data);
		const duplicateErrors = this.getDuplicateErrors(body.data);
		const rowErrors = await this.validateRows(body.data, body.mode, duplicateErrors);
		if (!rowErrors.length && !missingColumns.length) return [];
		return this.buildValidationResult(body.data.length, rowErrors, missingColumns);
	}

	private async validateRows(data: unknown[], mode: string, duplicateErrors: Map<number, RowErrors>): Promise<ImportRowResult[]> {
		const result: ImportRowResult[] = [];
		for (let index = 0; index < data.length; index++) {
			const rowErrors = await this.validateRow(data[index], mode, duplicateErrors.get(index));
			if (Object.keys(rowErrors).length) result.push({ [index]: rowErrors });
		}
		return result;
	}

	private async validateRow(raw: unknown, mode: string, duplicateErrors?: RowErrors): Promise<RowErrors> {
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
			return { row: ['La fila debe ser un objeto válido.'] };
		}
		const dto = plainToInstance(ValidateImportCollaboratorDto, raw);
		const [dtoErrors, databaseErrors] = await Promise.all([
			this.getDtoErrors(dto),
			this.getDatabaseErrors(dto, mode),
		]);
		const rowErrors: RowErrors = {};
		this.mergeErrors(rowErrors, dtoErrors);
		this.mergeErrors(rowErrors, duplicateErrors);
		this.mergeErrors(rowErrors, databaseErrors);
		return rowErrors;
	}

	private async getDtoErrors(dto: ValidateImportCollaboratorDto): Promise<RowErrors> {
		const errors = await validate(dto, {
			whitelist: true,
			forbidNonWhitelisted: true,
			forbidUnknownValues: true,
		});
		const rowErrors: RowErrors = {};
		for (const error of errors) {
			const messages = Object.values(error.constraints ?? {});
			if (messages.length) rowErrors[error.property] = messages;
		}
		return rowErrors;
	}

	private async getDatabaseErrors(dto: ValidateImportCollaboratorDto, mode: string): Promise<RowErrors> {
		const errors: RowErrors = {};
		if (mode !== 'news') return errors;
		const [emailExists, phoneExists, documentExists] = await Promise.all([
			dto.email ? this.collaboratorValidator.existsEmailCollaborator(dto.email) : false,
			dto.phone ? this.collaboratorValidator.existsPhoneCollaborator(dto.phone) : false,
			dto.number_document ? this.collaboratorValidator.existsDocumentNumberCollaborator(dto.number_document) : false,
		]);
		console.log('emailExists',emailExists);
		
		if (emailExists) this.addError(errors, 'email', 'El correo ya se encuentra registrado.');
		if (phoneExists) this.addError(errors, 'phone', 'El teléfono ya se encuentra registrado.');
		if (documentExists) this.addError(errors, 'number_document', 'El número de documento ya se encuentra registrado.');
		return errors;
	}

	private getDuplicateErrors(data: unknown[]): Map<number, RowErrors> {
		const errors = new Map<number, RowErrors>();
		this.findDuplicates(data, 'email', 'El correo', errors);
		this.findDuplicates(data, 'phone', 'El teléfono', errors);
		this.findDuplicates(data, 'number_document', 'El número de documento', errors);
		return errors;
	}

	private findDuplicates(data: unknown[], field: DuplicateField, label: string, errors: Map<number, RowErrors>): void {
		const occurrences = new Map<string, number[]>();
		data.forEach((row, index) => {
			if (!row || typeof row !== 'object' || Array.isArray(row)) return;
			const value = this.normalizeValue((row as Record<string, unknown>)[field]);
			if (!value) return;
			const indexes = occurrences.get(value) ?? [];
			indexes.push(index);
			occurrences.set(value, indexes);
		});
		occurrences.forEach((indexes, value) => {
			if (indexes.length < 2) return;
			const rows = indexes.map((index) => this.getRowNumber(data[index], index));
			const message = `${label} está repetido en las filas ${rows.join(', ')}.`;
			indexes.forEach((index) => {
				const rowErrors = errors.get(index) ?? {};
				this.addError(rowErrors, field, message);
				errors.set(index, rowErrors);
			});
		});
	}

	private getMissingColumns(data: unknown[]): string[] {
		const receivedFields = new Set<string>();
		for (const row of data) {
			if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
			Object.keys(row).forEach((field) => receivedFields.add(field));
		}
		return ValidateImportCollaboratorDto.REQUIRED_FIELDS.filter((field) => !receivedFields.has(field));
	}

	private getRowNumber(row: unknown, index: number): string | number {
		if (!row || typeof row !== 'object' || Array.isArray(row)) return index + 1;
		const value = (row as Record<string, unknown>).index;
		return typeof value === 'string' || typeof value === 'number' ? value : index + 1;
	}

	private normalizeValue(value: unknown): string {
		return String(value ?? '').trim().toLowerCase();
	}

	private mergeErrors(target: RowErrors, source?: RowErrors): void {
		if (!source) return;
		for (const [field, messages] of Object.entries(source)) {
			messages.forEach((message) => this.addError(target, field, message));
		}
	}

	private addError(errors: RowErrors, field: string, message: string): void {
		errors[field] ??= [];
		errors[field].push(message);
	}

	private buildValidationResult(total: number, rowErrors: ImportRowResult[], missingColumns: string[]): ValidationResult[] {
		return [
			{ field: 'data', message: rowErrors },
			{ field: 'missing_columns', message: missingColumns },
			{ field: 'total', message: total },
			{ field: 'errors', message: rowErrors.length },
		];
	}

	protected async validateFiles(): Promise<ValidationResult[]> {
		return [];
	}
}