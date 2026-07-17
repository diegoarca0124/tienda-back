import { capitalizeWords } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EditSubcategoryDto {
	@MaxLength(50, { message: 'El titulo debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El titulo debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El titulo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El titulo no debe estar vacio.' })
	@IsDefined({ message: 'El titulo es obligatorio.' })
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

	@IsOptional()
	updatedAt?: Date;
}
