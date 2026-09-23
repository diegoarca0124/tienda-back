import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
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
		if (normalizedValue === 'activo') return 'Activo';
		if (normalizedValue === 'inactivo') return 'Inactivo';
		return value;
	})
	@IsIn(['Activo', 'Inactivo'], { message: 'El estado solo puede ser Activo o Inactivo.' })
	@IsString({ message: 'El estado debe ser una cadena de texto.' })
	@IsDefined({ message: 'El estado es obligatorio.' })
	readonly status: 'Activo' | 'Inactivo';
}

export class ImportCollaboratorsDto {
	@IsArray({message: 'Debe enviar un arreglo de registros.'})
	@ArrayMinSize(1, {message: 'Debe incluir al menos un registro.'})
	@ArrayMaxSize(100, {message: 'Solo se permiten 100 registros por importación.'})
	data: unknown[];

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
