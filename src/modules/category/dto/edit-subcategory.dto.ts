import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EditSubcategoryDto {
	@MaxLength(50, { message: 'El titulo debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El titulo debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El titulo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	name: string;

	slug: string;

	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	@MinLength(11, { message: 'El icono debe tener minimo 11 caracteres.' })
	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El icono es obligatorio' })
	readonly icon: string;
}
