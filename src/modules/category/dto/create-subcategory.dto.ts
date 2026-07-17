import { capitalizeWords } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateSubcategoryDto {
	@MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@Transform(({ value }) => capitalizeWords(value))
	name: string;

	@IsString({ message: 'El prefijo debe ser texto' })
	@Matches(/^[A-Z]{2}$/, {
		message: 'El prefijo debe tener exactamente 2 letras en mayúscula (A-Z)',
	})
	@IsNotEmpty({ message: 'El prefijo no debe estar vacio.' })
	@IsDefined({ message: 'El prefijo es obligatorio.' })
	prefix: string;

	slug: string;

	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsOptional()
	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	readonly icon: string;

	@IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
	categoryId?: string;
}
