import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateProductDescriptiomDto {
	@IsUUID('4', { message: 'attributeId: La categoría debe ser un UUID válido' })
	attributeId: string;

	@IsUUID('4', { message: 'productId: El ID de producto debe ser un UUID válido' })
	productId: string;

	@MaxLength(100, { message: 'El valor no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'El valor debe tener al menos 2 caracteres' })
	@IsString({ message: 'El valor debe ser una cadena de caracteres' })
	@IsOptional()
	value: string;
}
