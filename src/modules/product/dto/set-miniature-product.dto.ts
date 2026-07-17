import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class SetMiniatureProductDto {
	@MaxLength(255, { message: 'La miniature debe tener máximo 255 caracteres.' })
	@MinLength(3, { message: 'La miniature debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La miniature debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La miniature es obligatoria' })
	readonly miniature: string;
}
