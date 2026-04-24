import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EditCategoryDto {
	@MaxLength(50, { message: 'El titulo debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El titulo debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El titulo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	name: string;

	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@MaxLength(2000, { message: 'La descripción debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La descripción es obligatoria' })
	readonly description: string;

	readonly slug: string;

	@MaxLength(2000, { message: 'El icono debe tener máximo 2000 caracteres.' })
	@IsString({ message: 'El icono debe ser una cadena de caracteres.' })
	@IsOptional()
	readonly icon: string;

	@IsBoolean({ message: 'El campo “Dimensiones” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Dimensiones” es requerido.' })
	@TransformBoolean()
	isDimensions: boolean;

	@IsBoolean({ message: 'El campo “Condición” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Condición” es requerido.' })
	@TransformBoolean()
	isConditiom: boolean;

	@IsBoolean({ message: 'El campo “Caracteristicas” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Caracteristicas” es requerido.' })
	@TransformBoolean()
	isCharacteristics: boolean;

	@IsBoolean({ message: 'El campo “Garantía” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Garantía” es requerido.' })
	@TransformBoolean()
	isWarranty: boolean;

	@IsBoolean({ message: 'El campo “País de origen” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “País de origen” es requerido.' })
	@TransformBoolean()
	isCountryOfOrigin: boolean;

	@IsBoolean({ message: 'El campo “Material” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Material” es requerido.' })
	@TransformBoolean()
	isMaterial: boolean;

	@IsBoolean({ message: 'El campo “Temperatura” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Temperatura” es requerido.' })
	@TransformBoolean()
	isTemperature: boolean;
}
