import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, IsUUID, MinLength, MaxLength, ValidateNested, IsDefined } from 'class-validator';

class ValueDto {
	@IsString()
	@IsNotEmpty({ message: 'El campo value no puede estar vacío' })
	value: string;
}

export class CreateAttributeDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@Transform(({ value }) => capitalizeWords(value))
	name: string;

	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsOptional()
	@MaxLength(100, { message: 'La unidad no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'La unidad debe tener al menos 2 caracteres' })
	@IsString({ message: 'La unidad debe ser una cadena de caracteres' })
	unit?: string;

	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsOptional()
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(2000, { message: 'La descripción debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@Transform(({ value }) => normalizeText(value))
	description?: string;

	@ArrayNotEmpty({ message: 'Debe proporcionar al menos un valor' })
	@ValidateNested({ each: true })
	@Type(() => ValueDto) // transforma cada objeto en una instancia de ValueDto
	@IsArray()
	values: ValueDto[];

	@IsUUID('4', { message: 'El grupo debe ser un UUID válido' })
	attributeGroupId?: string;
}
