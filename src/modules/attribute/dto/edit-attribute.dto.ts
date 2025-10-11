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
	@IsNotEmpty({ message: 'name: El nombre es obligatorio' })
	@IsString({ message: 'name: El nombre debe ser una cadena de caracteres' })
	@MinLength(3, { message: 'name: El nombre debe tener al menos 3 caracteres' })
	@MaxLength(100, { message: 'name: El nombre no puede tener más de 100 caracteres' })
	name: string;

	code?: string;

	@IsOptional()
	@IsString({ message: 'unit: La unidad debe ser una cadena de caracteres' })
	@MinLength(2, { message: 'unit: La unidad debe tener al menos 2 caracteres' })
	@MaxLength(100, { message: 'unit: La unidad no puede tener más de 100 caracteres' })
	unit?: string;

	@IsArray()
	@ArrayNotEmpty({ message: 'categories: Debe seleccionar al menos una categoría' })
	@IsUUID('4', { each: true, message: 'categories: Cada categoría debe ser un UUID válido' })
	categories: string[];
}
