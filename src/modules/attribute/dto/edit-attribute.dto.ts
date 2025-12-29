import { Type } from 'class-transformer';
import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsArray,
	ArrayNotEmpty,
	IsUUID,
	MinLength,
	MaxLength,
	ValidateNested,
} from 'class-validator';

export class EditAttributeDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	name: string;

	code?: string;

	@MaxLength(100, { message: 'La unidad no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'La unidad debe tener al menos 2 caracteres' })
	@IsString({ message: 'La unidad debe ser una cadena de caracteres' })
	@IsOptional()
	unit?: string;

	@IsUUID('4', { each: true, message: 'Cada categoría debe ser un UUID válido' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una categoría' })
	@IsArray()
	categories: string[];
}
