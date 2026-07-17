import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform, Type } from 'class-transformer';
import { IsDefined, IsEmail, IsIn, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { IsValidDocumentNumber } from '../validators/valid-document-number.validator';

const DOCUMENT_VALUES = ['DNI', 'CE - Carné de Extranjería', 'Pasaporte'];

export class EditCollaboratorDto {
	@Transform(({ value }) => capitalizeWords(value))
	@MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	readonly names: string;

	@Transform(({ value }) => capitalizeWords(value))
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

	@Transform(({ value }) => normalizeText(value).toLowerCase())
	@MaxLength(50, { message: 'El correo debe tener máximo 50 caracteres.' })
	@IsEmail({}, { message: 'El correo no tiene un formato correcto.' })
	@IsNotEmpty({ message: 'El correo no debe estar vacio.' })
	@IsDefined({ message: 'El correo es obligatorio.' })
	readonly email: string;

	@IsIn(DOCUMENT_VALUES, { message: 'El tipo de documento no es válido.' })
	@IsString({ message: 'El tipo de documento debe ser texto.' })
	@IsNotEmpty({ message: 'El tipo de documento no debe estar vacío.' })
	@IsDefined({ message: 'El tipo de documento es obligatorio.' })
	readonly type_document: string;

	@IsValidDocumentNumber()
	@IsString({ message: 'El número de documento debe ser texto.' })
	@IsNotEmpty({ message: 'El número de documento no debe estar vacio.' })
	@IsDefined({ message: 'El número de documento es obligatorio.' })
	@Transform(({ value }) => String(value).trim())
	readonly number_document: string;

	@MaxLength(20, { message: 'La contraseña debe tener máximo 20 caracteres.' })
	@MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres.' })
	@IsOptional()
	password: string;

	updatedAt?: Date;
}
