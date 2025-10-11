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

export class CreateAttributeValueDto {
	@IsNotEmpty({ message: 'El valor es obligatorio' })
	@IsString({ message: 'El valor debe ser una cadena de caracteres' })
	@MinLength(1, { message: 'El valor debe tener al menos 1 caracteres' })
	@MaxLength(100, { message: 'El valor no puede tener más de 100 caracteres' })
	readonly value: string;

	code: string;

	@IsUUID('4', { message: 'attributeId: La categoría debe ser un UUID válido' })
	readonly attributeId?: string;
}
