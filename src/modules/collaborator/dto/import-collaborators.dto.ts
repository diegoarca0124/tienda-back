import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateCollaboratorDto } from './create-collaborator.dto';
import { OmitType } from '@nestjs/mapped-types';
import { ALLOWED_PREFIX } from '../constants/allowed-prefix.constant';

export class ValidateImportCollaboratorDto extends OmitType(CreateCollaboratorDto, ['password'] as const) {
	static REQUIRED_FIELDS = ['names', 'surname', 'email', 'prefix', 'phone', 'role', 'type_document', 'number_document', 'status'];

	@IsString({ message: 'El prefijo debe ser una cadena de texto.' })
	@IsNotEmpty({ message: 'El prefijo es obligatorio.' })
	@IsIn(ALLOWED_PREFIX, { message: 'El prefijo no es válido.' })
	prefix?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: 'El índice debe ser un número entero.' })
	@Min(1, { message: 'El índice debe ser mayor o igual a 1.' })
	readonly index?: number;

	@Transform(({ value }) => {
		if (typeof value !== 'string') return value;
		const normalizedValue = value.trim().toLowerCase();
		if (normalizedValue === 'true') return true;
		if (normalizedValue === 'false') return false;
		return value;
	})
	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@IsDefined({ message: 'El estado es obligatorio.' })
	readonly status: boolean;
}

export class ImportCollaboratorsDto {
	@IsArray({ message: 'Debe enviar un arreglo de registros.' })
	data: any[];

	@IsIn(['news', 'upsert', 'update'], {
		message: 'El modo no es un valor válido',
	})
	@IsString({ message: 'El modo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El modo no debe estar vacio.' })
	@IsDefined({ message: 'El modo es obligatorio.' })
	readonly mode: string;

	@IsIn(['email', 'number_document'], {
		message: 'El identificador no es un valor válido',
	})
	@IsString({ message: 'El identificador debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El identificador no debe estar vacio.' })
	@IsDefined({ message: 'El identificador es obligatorio.' })
	readonly identifyBy: string;
}
