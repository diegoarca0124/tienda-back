import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { normalizeText } from '@/common/utils/string.util';
import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsDefined,
	IsEmail,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsNotEmptyObject,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
	ValidateNested,
} from 'class-validator';
import { Column } from 'typeorm';
import { IsGreaterThan } from '../validators/is-greater-than.validator';
import { IsLessThan } from '../validators/is-less-than.validator';
import { IsValidVariations } from '../validators/is-valid-variations.validator';
import { IsValidAttributes } from '../validators/is-valid-attributes.validator';

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

export class ProductAttributeDto {
	@IsUUID('4', { message: 'La caracteristica debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La caracteristica es requerida.' })
	attributeId: string;

	@IsUUID('4', { message: 'El valor de la caracteristica debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'El valor de la caracteristica es requerida.' })
	attributeValueId: string;

	@IsString({ message: 'El valor debe ser una cadena de texto.' })
	@MinLength(1, { message: 'El valor no puede estar vacío.' })
	@MaxLength(100, { message: 'El valor debe tener máximo 100 caracteres.' })
	value: string;
}

export class CreateProductDto {
	@IsIn(['published', 'draft'], {
		message: 'El estado no es un valor válido',
	})
	@IsNotEmpty({ message: 'El estado no debe estar vacio.' })
	@IsDefined({ message: 'El estado es obligatorio.' })
	readonly status: string;

	@IsIn(['public', 'private'], {
		message: 'La visibilidad no es un valor válido',
	})
	@IsNotEmpty({ message: 'La visibilidad no debe estar vacio.' })
	@IsDefined({ message: 'La visibilidad es obligatoria.' })
	readonly visibility: string;

	@Transform(({ value }) => normalizeText(value))
	@MaxLength(250, { message: 'El nombre debe tener máximo 250 caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre no debe estar vacio.' })
	@IsDefined({ message: 'El nombre es obligatorio.' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	name: string;

	slug: string;
	type: string;

	@Transform(({ value }) => normalizeText(value))
	@MaxLength(1000, { message: 'La descripción debe tener máximo 1000 caracteres.' })
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La descripción no debe estar vacia.' })
	@IsDefined({ message: 'La descripción es obligatoria.' })
	description: string;

	@Transform(({ value }) => normalizeText(value))
	@MaxLength(250, { message: 'El extracto debe tener máximo 250 caracteres.' })
	@MinLength(3, { message: 'El extracto debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El extracto debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El extracto no debe estar vacio.' })
	@IsDefined({ message: 'El extracto es obligatorio.' })
	extract: string;

	@IsString({ message: 'La portada debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La portada no debe estar vacia.' })
	@IsDefined({ message: 'La portada es obligatoria.' })
	cover?: string;

	@IsString({ message: 'La miniatura debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La miniatura no debe estar vacia.' })
	@IsDefined({ message: 'La miniatura es obligatoria.' })
	miniature?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	gallery?: string[];

	@IsObject({ message: 'La unidad debe ser un objeto válido.' })
	@IsNotEmpty({ message: 'La unidad es requerida.' })
	@IsDefined({ message: 'La unidad es obligatoria.' })
	unitOfMeasure: { group: string; name: string; abbr: string };

	@ValidateIf((o) => o.isConditiom === 'true')
	@MaxLength(50, { message: 'La condición debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'La condición debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La condición debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La condición no debe estar vacia.' })
	@IsDefined({ message: 'La condición es obligatoria.' })
	condition: string;

	@ValidateIf((o) => o.isWarranty === 'true')
	@MaxLength(100, { message: 'La garantía debe tener máximo 100 caracteres.' })
	@MinLength(3, { message: 'La garantía debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La garantía debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La garantía no debe estar vacia.' })
	@IsDefined({ message: 'La garantía es obligatoria.' })
	warranty: string;

	@ValidateIf((o) => o.isCountryOfOrigin === 'true')
	@ValidateNested()
	@Type(() => CountryDto)
	@IsObject({ message: 'El país debe ser un objeto válido' })
	@IsNotEmptyObject({}, { message: 'El país no debe estar vacío.' })
	@IsDefined({ message: 'El país es obligatorio' })
	countryOfOrigin: CountryDto;

	@Min(0.01, { message: 'El precio regular debe ser mayor a 0.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El precio regular debe ser un número válido.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsGreaterThan('priceDiscount', {
		message: 'El precio regular debe ser mayor que el precio con descuento.',
	})
	@IsNotEmpty({ message: 'El precio regular no debe estar vacío.' })
	@IsDefined({ message: 'El precio regular es obligatorio.' })
	priceRegular: number;

	@Min(0, { message: 'El precio con descuento no puede ser menor que 0.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El precio con descuento debe ser un número válido.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsLessThan('priceRegular', {
		message: 'El precio con descuento debe ser menor que el precio regular.',
	})
	@IsOptional()
	priceDiscount: number;

	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El stock mínimo debe ser un número válido.' })
	@Min(0, { message: 'El stock mínimo no puede ser negativo.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsOptional()
	minStock: number;

	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El stock máximo debe ser un número válido.' })
	@Min(0, { message: 'El stock máximo no puede ser negativo.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsOptional()
	maxStock: number;

	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El máximo por pedido debe ser un número válido.' })
	@Min(0, { message: 'El máximo por pedido no puede ser negativo.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsOptional()
	maxOrderLimit: number;

	@ArrayMaxSize(20, { message: 'Máximo se permiten 20 etiquetas.' })
	@IsString({ each: true, message: 'Cada etiqueta debe ser una cadena de texto.' })
	@IsArray({ message: 'Las etiquetas deben ser un arreglo.' })
	tags?: string[];

	@IsUUID('4', { message: 'La marca debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La marca no debe estar vacia.' })
	@IsDefined({ message: 'La marca es obligatoria.' })
	brandId: string;

	@IsUUID('4', { message: 'La categoría debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La categoría no debe estar vacía.' })
	@IsDefined({ message: 'La categoría es obligatoria.' })
	categoryId?: string;

	@IsUUID('4', { message: 'La subcategoría debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La subcategoría no debe estar vacía.' })
	@IsDefined({ message: 'La subcategoría es obligatoria.' })
	subcategoryId?: string;

	@IsUUID('4', { message: 'El grupo debe ser un UUID válido' })
	@IsOptional()
	productGroupId: string;

	@IsBoolean({ message: 'El campo “Más vendido” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Más vendido” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Más vendido” es obligatorio.' })
	@TransformBoolean()
	isBestSeller?: boolean;

	@IsBoolean({ message: 'El campo “Nuevo en catálogo” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Nuevo en catálogo” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Nuevo en catálogo” es obligatorio.' })
	@TransformBoolean()
	isNewArrival?: boolean;

	@IsBoolean({ message: 'El campo “Destacado” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Destacado” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Destacado” es obligatorio.' })
	@TransformBoolean()
	isFeatured?: boolean;

	@IsBoolean({ message: 'El campo “Edición limitada” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Edición limitada” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Edición limitada” es obligatorio.' })
	@TransformBoolean()
	isLimitedEdition?: boolean;

	@IsBoolean({ message: 'El campo “Preventa” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Preventa” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Preventa” es obligatorio.' })
	@TransformBoolean()
	isPreOrder?: boolean;

	@IsBoolean({ message: 'El campo “Exportable” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Exportable” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Exportable” es obligatorio.' })
	@TransformBoolean()
	isExportable?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Permitir pedidos sin stock” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Permitir pedidos sin stock” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Permitir pedidos sin stock” es obligatorio.' })
	allowBackorder?: boolean;

	@Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
	@IsDefined({ message: 'Los atributos son obligatorios.' })
	@IsArray({ message: 'Los atributos deben ser un arreglo.' })
	@IsValidAttributes({
		message: 'Los atributos tienen una estructura inválida.',
	})
	attributes: any[];

	// ---------- WEIGHT ----------
	@ValidateIf((o) => o.isDimensions === 'true')
	@Min(0.01, { message: 'El peso debe ser mayor a 0.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El peso debe ser un número válido.' })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') {
			return value;
		}
		const number = parseFloat(String(value));
		return isNaN(number) ? value : number;
	})
	@IsNotEmpty({ message: 'El peso no debe estar vacío.' })
	@IsDefined({ message: 'El peso es obligatorio.' })
	weight?: number;

	// ---------- HEIGHT ----------
	@ValidateIf((o) => o.isDimensions === 'true')
	@Min(0.01, { message: 'La altura debe ser mayor a 0.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'La altura debe ser un número válido.' })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') {
			return value;
		}
		const number = parseFloat(String(value));
		return isNaN(number) ? value : number;
	})
	@IsNotEmpty({ message: 'El alto no debe estar vacío.' })
	@IsDefined({ message: 'El alto es obligatorio.' })
	height?: number;

	// ---------- WIDTH ----------
	@ValidateIf((o) => o.isDimensions === 'true')
	@Min(0.01, { message: 'El ancho debe ser mayor a 0.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El ancho debe ser un número válido.' })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') {
			return value;
		}
		const number = parseFloat(String(value));
		return isNaN(number) ? value : number;
	})
	@IsNotEmpty({ message: 'El ancho no debe estar vacío.' })
	@IsDefined({ message: 'El ancho es obligatorio.' })
	width?: number;

	// ---------- LENGTH ----------
	@ValidateIf((o) => o.isDimensions === 'true')
	@Min(0.01, { message: 'El largo debe ser mayor a 0.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'El largo debe ser un número válido.' })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') {
			return value;
		}
		const number = parseFloat(String(value));
		return isNaN(number) ? value : number;
	})
	@IsNotEmpty({ message: 'El largo no debe estar vacío.' })
	@IsDefined({ message: 'El largo es obligatorio.' })
	length?: number;

	// ---------- WEIGHT UNIT ----------
	@ValidateIf((o) => o.isDimensions === 'true')
	@IsObject({ message: 'La unidad de peso debe ser un objeto válido.' })
	@IsNotEmpty({ message: 'La unidad de peso no debe estar vacía.' })
	@IsDefined({ message: 'La unidad de peso es obligatoria.' })
	weightUnit?: { group: string; name: string; abbr: string };

	/* o.isDimensions === false */
	@ValidateIf((o) => o.isDimensions === 'true')
	@IsObject({ message: 'La unidad de dimensión debe ser un objeto válido.' })
	@IsNotEmpty({ message: 'La unidad de dimensión no debe estar vacía.' })
	@IsDefined({ message: 'La unidad de dimensión es obligatoria.' })
	dimensionUnit?: { group: string; name: string; abbr: string };

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Es frágil” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Es frágil” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Es frágil” es obligatorio.' })
	isFragile?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Es perecible” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Es perecible” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Es perecible” es obligatorio.' })
	isPerishable?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Es ecológico” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Es ecológico” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Es ecológico” es obligatorio.' })
	isEcoFriendly?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Es biodegradable” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Es biodegradable” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Es biodegradable” es obligatorio.' })
	isBiodegradable?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Es peligroso” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Es peligroso” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Es peligroso” es obligatorio.' })
	isHazardous?: boolean;

	@TransformBoolean()
	@IsBoolean({
		message: 'El campo “Requiere refrigeración” debe ser verdadero o falso.',
	})
	@IsNotEmpty({ message: 'El campo “Requiere refrigeración” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Requiere refrigeración” es obligatorio.' })
	isRequiresRefrigeration?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Es flamable” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Es flamable” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Es flamable” es obligatorio.' })
	isFlammable?: boolean;

	@TransformBoolean()
	@IsBoolean({
		message: 'El campo “Requiere ensamblaje” debe ser verdadero o falso.',
	})
	@IsNotEmpty({ message: 'El campo “Requiere ensamblaje” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Requiere ensamblaje” es obligatorio.' })
	isRequiresAssembly?: boolean;

	@ValidateIf((o) => o.isTemperature === 'true')
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'La temperatura mínima debe ser un número válido.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	minStorageTemp: number;

	@ValidateIf((o) => o.isTemperature === 'true')
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'La temperatura máxima debe ser un número válido.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	maxStorageTemp: number;

	@ValidateIf((o) => o.isTemperature === 'true')
	@IsObject({ message: 'La unidad de temperatura debe ser un objeto válido.' })
	storageTempUnit: { name: string; abbr: string };

	@ValidateIf((o) => o.isMaterial === 'true')
	@MaxLength(50, { message: 'El material debe tener máximo 50 caracteres.' })
	@IsString({ message: 'El material debe ser una cadena de caracteres.' })
	@IsOptional()
	material?: string;

	@MaxLength(50, { message: 'El tipo de paquete debe tener máximo 50 caracteres.' })
	@IsString({ message: 'El tipo de paquete debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El tipo de paquete no debe estar vacío.' })
	@IsDefined({ message: 'El tipo de paquete es obligatorio.' })
	packageType: string;

	@Min(1, { message: 'Los días de preparación deben ser mayor a 0.' })
	@IsInt({ message: 'Los días de preparación deben ser un número entero.' })
	@IsNumber({ allowInfinity: false, allowNaN: false }, { message: 'Los días de preparación deben ser un número válido.' })
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsNotEmpty({ message: 'Los días de preparación son requeridos.' })
	handlingDays: number;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Envío gratis” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Envío gratis” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Envío gratis” es obligatorio.' })
	freeShipping?: boolean;

	@TransformBoolean()
	@IsBoolean({ message: 'El campo “Recojo en tienda” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Recojo en tienda” no debe estar vacío.' })
	@IsDefined({ message: 'El campo “Recojo en tienda” es obligatorio.' })
	pickupInStore?: boolean;

	@IsString({ message: 'Las instrucciones especiales deben ser una cadena de texto.' })
	@MinLength(2, { message: 'El valor debe tener al menos 2 caracteres' })
	@IsOptional()
	specialInstructions?: string;

	@Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
	@IsDefined({ message: 'Las variaciones son obligatorias.' })
	@IsArray({ message: 'Las variaciones deben ser un arreglo.' })
	@IsValidVariations({
		message: 'Las variaciones tienen una estructura inválida.',
	})
	variations: any[];

	isDimensions: boolean;
}
