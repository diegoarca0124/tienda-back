import { Type } from 'class-transformer';
import { IsString, IsOptional, IsUUID, MinLength, MaxLength, ArrayMinSize, ValidateNested } from 'class-validator';

class EditProductDescriptionDto {
	@IsUUID('4', { message: 'El attributeId debe ser un UUID válido' })
	attributeId?: string;

	@IsUUID('4', { message: 'El productId debe ser un UUID válido' })
	productId?: string;

	@IsUUID('4', { message: 'El attributeValueId debe ser un UUID válido' })
	attributeValueId?: string;

	@MaxLength(100, { message: 'El valor no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'El valor debe tener al menos 2 caracteres' })
	@IsString({ message: 'El valor debe ser una cadena de caracteres' })
	@IsOptional()
	value?: string;
}

export class EditProductDescriptionsDto {
	@ValidateNested({ each: true })
	@Type(() => EditProductDescriptionDto)
	descriptions: EditProductDescriptionDto[];

	@IsUUID('4', { message: 'El attributeId debe ser un UUID válido' })
	attributeId: string;

	@IsUUID('4', { message: 'El productId debe ser un UUID válido' })
	productId: string;

	@IsUUID('4', { message: 'El productId debe ser un UUID válido' })
	groupId: string;
}
