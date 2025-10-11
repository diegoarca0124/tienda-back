import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
	@IsString({ message: 'El titulo debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El titulo debe tener minimo 3 caracteres.' })
	@MaxLength(50, { message: 'El titulo debe tener máximo 50 caracteres.' })
	name: string;

	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(2000, { message: 'La descripción debe tener máximo 2000 caracteres.' })
	readonly description: string;

	slug: string;

	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	@MinLength(11, { message: 'El icono debe tener minimo 11 caracteres.' })
	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	readonly icon: string;
}
