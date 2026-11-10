import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, IsEmail, Matches, MaxLength, MinLength } from 'class-validator';
import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { IsValidDocumentNumber } from '../validators/valid-document-number.validator';
import { ALLOWED_DOCUMENT } from '../constants/allowed-document.constant';

import { ALLOWED_PREFIX } from '../constants/allowed-prefix.constant';

export class ValidateImportCollaboratorDto {
	@Transform(({ value }) => (typeof value === 'string' ? capitalizeWords(value) : value))
	@MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	readonly names: string;

	@Transform(({ value }) => (typeof value === 'string' ? capitalizeWords(value) : value))
	@MaxLength(50, { message: 'El apellido debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El apellido debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El apellido debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El apellido no debe estar vacio.' })
	@IsDefined({ message: 'El apellido es obligatorio.' })
	readonly surname: string;

	@Matches(/^\d{9}$/, { message: 'El telefono debe tener exactamente 9 dígitos.' })
	@IsString({ message: 'El teléfono debe ser una cadena de texto.' })
	@IsNotEmpty({ message: 'El telefono no debe estar vacio.' })
	@IsDefined({ message: 'El telefono es obligatorio.' })
	@Transform(({ value }) => String(value).trim())
	readonly phone: string;

	@IsIn(['DEFAULT'], { message: 'El rol no es un valor válido.' })
	@MaxLength(20, { message: 'El rol debe tener máximo 20 caracteres.' })
	@MinLength(3, { message: 'El rol debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El rol debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El rol no debe estar vacio.' })
	@IsDefined({ message: 'El rol es obligatorio.' })
	readonly role: string;

	@IsOptional()
	readonly fullnames?: string;

	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value).toLowerCase() : value))
	@MaxLength(50, { message: 'El correo debe tener máximo 50 caracteres.' })
	@IsEmail({}, { message: 'El correo no tiene un formato correcto.' })
	@IsNotEmpty({ message: 'El correo no debe estar vacio.' })
	@IsDefined({ message: 'El correo es obligatorio.' })
	readonly email: string;

	@IsIn(ALLOWED_DOCUMENT, { message: 'El tipo de documento no es válido.' })
	@IsString({ message: 'El tipo de documento debe ser texto.' })
	@IsNotEmpty({ message: 'El tipo de documento no debe estar vacío.' })
	@IsDefined({ message: 'El tipo de documento es obligatorio.' })
	readonly type_document: string;

	@IsValidDocumentNumber()
	@IsString({ message: 'El número de documento debe ser texto.' })
	@IsNotEmpty({ message: 'El número de documento no debe estar vacio.' })
	@IsDefined({ message: 'El número de documento es obligatorio.' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	readonly number_document: string;

	static REQUIRED_FIELDS = ['names', 'surname', 'email', 'prefix', 'phone', 'role', 'type_document', 'number_document', 'status'];

	@Transform(({ value }) => {
		if (typeof value !== 'string') return value;
		const prefix = value.trim();
		const originalPrefix = prefix.startsWith("'") ? prefix.slice(1) : prefix;
		return ALLOWED_PREFIX.includes(originalPrefix) ? originalPrefix : value;
	})
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
	@IsArray({ message: 'Debe enviar un arreglo de registros.' })
	@ArrayMinSize(1, { message: 'Debe incluir al menos un registro.' })
	@ArrayMaxSize(100, { message: 'Solo se permiten 100 registros por importación.' })
	data: unknown[];

	@IsIn(['news', 'upsert', 'update'], {
		message: 'El modo no es un valor válido',
	})
	@IsString({ message: 'El modo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El modo no debe estar vacio.' })
	@IsDefined({ message: 'El modo es obligatorio.' })
	readonly mode: 'news' | 'upsert' | 'update';

	@IsIn(['email', 'number_document'], {
		message: 'El identificador no es un valor válido',
	})
	@IsString({ message: 'El identificador debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El identificador no debe estar vacio.' })
	@IsDefined({ message: 'El identificador es obligatorio.' })
	readonly identifyBy: 'email' | 'number_document';
}
