import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform, Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, IsUrl, Length, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class CountryDto {
	@IsString({ message: 'El código de país es requerido' })
	@IsNotEmpty({ message: 'El código de país no puede estar vacío' })
	code: string;

	@IsString({ message: 'El nombre de país es requerido' })
	@IsNotEmpty({ message: 'El nombre de país no puede estar vacío' })
	name: string;

	@IsString({ message: 'La bandera es requerida' })
	@IsNotEmpty({ message: 'La bandera no puede estar vacía' })
	flag: string;
}

export class EditBrandDto {
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
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

	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsOptional()
	@MaxLength(2000, { message: 'La descripción debe tener máximo 2000 caracteres.' })
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@Transform(({ value }) => normalizeText(value))
	readonly description: string;

	slug?: string;

	@IsObject({ message: 'El país debe ser un objeto válido' })
	@ValidateNested()
	@Type(() => CountryDto)
	@IsNotEmptyObject({}, { message: 'El país no puede ser nulo' })
	country: CountryDto;

	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsOptional()
	@MaxLength(255, { message: 'La url debe tener máximo 255 caracteres.' })
	@MinLength(3, { message: 'La url debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La url debe ser una cadena de caracteres.' })
	readonly websiteUrl: string;

	@IsOptional()
	logoUrl?: string;

	@IsOptional()
	bannerUrl?: string;

	@IsOptional()
	updatedAt?: Date;
}
