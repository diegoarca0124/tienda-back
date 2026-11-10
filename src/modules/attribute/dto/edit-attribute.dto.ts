import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsDefined, IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class EditAttributeDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	@Transform(({ value }) => (typeof value === 'string' ? capitalizeWords(value) : value))
	readonly name: string;

	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) || null : value))
	@IsOptional()
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(250, { message: 'La descripción debe tener máximo 250 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	readonly description?: string | null;

	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) || null : value))
	@IsOptional()
	@MaxLength(100, { message: 'La unidad no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'La unidad debe tener al menos 2 caracteres' })
	@IsString({ message: 'La unidad debe ser una cadena de caracteres' })
	readonly unit?: string | null;
}
