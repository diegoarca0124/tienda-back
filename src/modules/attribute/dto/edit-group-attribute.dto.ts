import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, IsUUID, MinLength, MaxLength, ValidateNested, IsDefined } from 'class-validator';

export class EditGroupAttributeDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@Transform(({ value }) => capitalizeWords(value))
	name: string;

	@MaxLength(250, { message: 'La descripción no puede tener más de 250 caracteres' })
	@MinLength(2, { message: 'La descripción debe tener al menos 2 caracteres' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'La descripción no debe estar vacia.' })
	@IsDefined({ message: 'La descripción es obligatoria.' })
	@Transform(({ value }) => normalizeText(value))
	description: string;

	@IsUUID('4', { each: true, message: 'Cada categoría debe ser un UUID válido' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una categoría' })
	@IsArray()
	categories: string[];
}
