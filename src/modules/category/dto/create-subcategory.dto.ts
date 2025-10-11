import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSubcategoryDto {
	@IsString({ message: 'El titulo debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El titulo debe tener minimo 3 caracteres.' })
	@MaxLength(50, { message: 'El titulo debe tener máximo 50 caracteres.' })
	name: string;

	slug: string;

	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	@MinLength(11, { message: 'El icono debe tener minimo 11 caracteres.' })
	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	readonly icon: string;

	@IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
	categoryId?: string;
}
