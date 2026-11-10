import { ATTRIBUTE_VALUE_MAX_LENGTH } from '../constants/attribute-value.constant';
import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, ArrayUnique, IsObject, IsUUID, MinLength, MaxLength, ValidateNested, IsDefined } from 'class-validator';

class ValueDto {
	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) : value))
	@MaxLength(ATTRIBUTE_VALUE_MAX_LENGTH, { message: 'Cada valor debe tener máximo 100 caracteres.' })
	@IsString({ message: 'Cada valor debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'Los valores no pueden estar vacíos.' })
	@IsDefined({ message: 'Cada valor es obligatorio.' })
	readonly value: string;
}

export class CreateAttributeDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@Transform(({ value }) => (typeof value === 'string' ? capitalizeWords(value) : value))
	readonly name: string;

	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) || undefined : value))
	@IsOptional()
	@MaxLength(100, { message: 'La unidad no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'La unidad debe tener al menos 2 caracteres' })
	@IsString({ message: 'La unidad debe ser una cadena de caracteres' })
	readonly unit?: string;

	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) || undefined : value))
	@IsOptional()
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(250, { message: 'La descripción debe tener máximo 250 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	readonly description?: string;

	@ArrayNotEmpty({ message: 'Debe proporcionar al menos un valor' })
	@ArrayUnique((item: ValueDto) => (typeof item?.value === 'string' ? normalizeText(item.value).toLowerCase() : item), {
		message: 'Los valores del atributo no deben repetirse.',
	})
	@IsObject({ each: true, message: 'Cada valor debe ser un objeto con el campo value.' })
	@ValidateNested({ each: true })
	@Type(() => ValueDto) // transforma cada objeto en una instancia de ValueDto
	@IsArray({ message: 'Los valores deben ser una lista.' })
	@IsDefined({ message: 'Los valores son obligatorios.' })
	readonly values: ValueDto[];

	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsUUID('4', { message: 'El grupo debe ser un UUID válido' })
	@IsNotEmpty({ message: 'El grupo no debe estar vacío.' })
	@IsDefined({ message: 'El grupo es obligatorio.' })
	readonly attributeGroupId: string;
}
