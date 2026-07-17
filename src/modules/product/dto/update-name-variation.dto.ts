import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class UpdateNameVariationDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@IsOptional()
	name?: string;
}
