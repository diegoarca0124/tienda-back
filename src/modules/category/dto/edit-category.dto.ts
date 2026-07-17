import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { capitalizeWords, normalizeText } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDefined, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EditCategoryDto {
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

	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(2000, { message: 'La descripción debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La descripción no debe estar vacia.' })
	@IsDefined({ message: 'La descripción es obligatoria.' })
	@Transform(({ value }) => normalizeText(value))
	readonly description: string;

	readonly slug: string;

	@Transform(({ value }) => (value === '' ? undefined : value))
	@IsOptional()
	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	readonly icon: string;

	@IsBoolean({ message: 'El campo “Dimensiones” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Dimensiones” es requerido.' })
	@IsNotEmpty({ message: 'El campo “Dimensiones” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “Dimensiones” es obligatoria.' })
	isDimensions: boolean;

	@IsBoolean({ message: 'El campo “Caracteristicas” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Caracteristicas” es requerido.' })
	@IsNotEmpty({ message: 'El campo “Caracteristicas” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “Caracteristicas” es obligatoria.' })
	isCharacteristics: boolean;

	@IsBoolean({ message: 'El campo “Condición” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Condición” es requerido.' })
	@IsNotEmpty({ message: 'El campo “Condición” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “Condición” es obligatoria.' })
	isConditiom: boolean;

	@IsBoolean({ message: 'El campo “Garantía” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Garantía” es requerido.' })
	@IsNotEmpty({ message: 'El campo “Garantía” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “Garantía” es obligatoria.' })
	isWarranty: boolean;

	@IsBoolean({ message: 'El campo “País de origen” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “País de origen” es requerido.' })
	@IsNotEmpty({ message: 'El campo “País de origen” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “País de origen” es obligatoria.' })
	isCountryOfOrigin: boolean;

	@IsBoolean({ message: 'El campo “Material” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Material” es requerido.' })
	@IsNotEmpty({ message: 'El campo “Material” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “Material” es obligatoria.' })
	isMaterial: boolean;

	@IsBoolean({ message: 'El campo “Temperatura” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Temperatura” es requerido.' })
	@IsNotEmpty({ message: 'El campo “Temperatura” no debe estar vacía.' })
	@IsDefined({ message: 'El campo “Temperatura” es obligatoria.' })
	isTemperature: boolean;

	@IsOptional()
	updatedAt?: Date;
}
