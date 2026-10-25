import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty, ArrayUnique, IsUUID, MinLength, MaxLength, IsDefined } from 'class-validator';

export class CreateGroupAttributeDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@Transform(({ value }) => (typeof value === 'string' ? capitalizeWords(value) : value))
	name: string;

	@MaxLength(250, { message: 'La descripción no puede tener más de 250 caracteres' })
	@MinLength(2, { message: 'La descripción debe tener al menos 2 caracteres' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'La descripción no debe estar vacia.' })
	@IsDefined({ message: 'La descripción es obligatoria.' })
	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) : value))
	description: string;

	@ArrayUnique((id: unknown) => (typeof id === 'string' ? id.toLowerCase() : id), { message: 'Las categorías no deben repetirse.' })
	@IsUUID('4', { each: true, message: 'Cada categoría debe ser un UUID válido' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una categoría' })
	@IsArray({ message: 'Las categorías deben ser una lista.' })
	@IsDefined({ message: 'Las categorías son obligatorias.' })
	categories: string[];
}
