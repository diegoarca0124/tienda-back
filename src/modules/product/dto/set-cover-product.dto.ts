import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class SetCoverProductDto {
	@MaxLength(255, { message: 'La url debe tener máximo 255 caracteres.' })
	@MinLength(3, { message: 'La url debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La url debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La url es obligatoria' })
	readonly cover: string;
}
