import { Transform, Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsNotEmptyObject,
	IsObject,
	IsOptional,
	IsString,
	IsUrl,
	Length,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';

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
	@IsString({ message: 'El nombre debe ser una cadena de caracteres' })
	@MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
	@MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
	name: string;

	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(2000, { message: 'La descripción debe tener máximo 2000 caracteres.' })
	readonly description: string;

	slug?: string;

	@IsNotEmptyObject({}, { message: 'El país no puede ser nulo' })
	@IsObject({ message: 'El país debe ser un objeto válido' })
	@ValidateNested()
	@Type(() => CountryDto)
	country: CountryDto;

	@IsString({ message: 'websiteUrl: La url debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'websiteUrl: La url debe tener minimo 3 caracteres.' })
	@MaxLength(255, { message: 'websiteUrl: La url debe tener máximo 255 caracteres.' })
	readonly websiteUrl: string;

	@IsOptional()
	logoUrl?: string;

	@IsOptional()
	bannerUrl?: string;

	@IsOptional()
	updatedAt?: Date;
}
