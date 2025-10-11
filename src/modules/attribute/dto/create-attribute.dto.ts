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

class ValueDto {
	@IsString()
	@IsNotEmpty({ message: 'El campo value no puede estar vacío' })
	value: string;
}

export class CreateAttributeDto {
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	name: string;

	code?: string;

	@IsOptional()
	@IsString({ message: 'La unidad debe ser una cadena de caracteres' })
	@MinLength(2, { message: 'La unidad debe tener al menos 2 caracteres' })
	@MaxLength(100, { message: 'La unidad no puede tener más de 100 caracteres' })
	unit?: string;

	@IsArray()
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una categoría' })
	@IsUUID('4', { each: true, message: 'Cada categoría debe ser un UUID válido' })
	categories: string[];

	@IsArray()
	@ArrayNotEmpty({ message: 'Debe proporcionar al menos un value' })
	@ValidateNested({ each: true })
	@Type(() => ValueDto) // transforma cada objeto en una instancia de ValueDto
	values: ValueDto[];
}
