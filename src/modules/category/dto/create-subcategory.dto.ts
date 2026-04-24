import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSubcategoryDto {
	@MaxLength(50, { message: 'El titulo debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El titulo debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El titulo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	name: string;

	slug: string;

	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	@IsOptional()
	readonly icon: string;

	@IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
	categoryId?: string;
}
