import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { Column } from 'typeorm';

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
  @IsString({ message: 'El atributo debe ser una cadena de texto.' })
  @MinLength(1, { message: 'El atributo no puede estar vacío.' })
  @MaxLength(50, { message: 'El atributo debe tener máximo 50 caracteres.' })
  attribute: string;

  @IsString({ message: 'El valor debe ser una cadena de texto.' })
  @MinLength(1, { message: 'El valor no puede estar vacío.' })
  @MaxLength(100, { message: 'El valor debe tener máximo 100 caracteres.' })
  value: string;
}

export class SkuPatternFieldDto {
  @IsString({ message: 'El key debe ser una cadena.' })
  key: string;

  @IsInt({ message: 'chars debe ser un número entero.' })
  @Min(1, { message: 'chars debe ser mínimo 1.' })
  chars: number;
}

export class SkuPatternDto {
	
  @IsString({ message: 'El nombre del patrón es requerido.' })
  name: string;

  @IsArray({ message: 'fields debe ser un arreglo.' })
  @ValidateNested({ each: true })
  @Type(() => SkuPatternFieldDto)
  fields: SkuPatternFieldDto[];

  @IsString({ message: 'El example debe ser una cadena.' })
  example: string;
}

export class VariationDto {
  @ValidateNested()
  @Type(() => SkuPatternDto)
  skuPattern: SkuPatternDto;

  @IsString({ message: 'El nombre de la variación es requerido.' })
  name: string;
}

export class CreateProductDto {

	@IsString({ message: 'El grupo debe ser una cadena de caracteres.' })
	@IsOptional()
	productGroupId: string;
	
	@IsIn(['published','draft'], {
		message: 'El estado no es un valor válido',
	})
	@IsString({ message: 'El estado debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El estado es requerido.' })
	readonly status: string;

	@IsIn(['public','private'], {
		message: 'La visibilidad no es un valor válido',
	})
	@IsString({ message: 'La visibilidad debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La visibilidad es requerida.' })
	readonly visibility: string;
 
    @MaxLength(250, { message: 'El nombre debe tener máximo 250 caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre es requerido.' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    name: string;

	slug: string;

	type: string;
	
	@MaxLength(1000, { message: 'La descripción debe tener máximo 1000 caracteres.' })
	@MinLength(3, { message: 'La descripción debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La descripción debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La descripción es requerida.' })
	description: string;
	
	@MaxLength(250, { message: 'El extracto debe tener máximo 250 caracteres.' })
	@MinLength(3, { message: 'El extracto debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El extracto debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El extracto es requerido.' })
	extract: string;

	@IsOptional()
	cover?: string;

	@IsOptional()
	miniature?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	gallery?: string[];

	/* @MaxLength(100, { message: 'La propiedad principal debe tener máximo 100 caracteres.' })
	@MinLength(3, { message: 'La propiedad principal debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La propiedad principal debe ser una cadena de caracteres.' }) */
	/* @IsOptional() */
	/* @IsNotEmpty({ message: 'La propiedad principal es requerida.' }) */

	@IsObject({ message: 'La propiedad principal debe ser un objeto válido.' })
	@IsOptional()
	mainAttribute: { id: string; name: string };
	
	@MaxLength(100, { message: 'El valor de propiedad debe tener máximo 100 caracteres.' })
	@MinLength(3, { message: 'El valor de propiedad debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El valor de propiedad debe ser una cadena de caracteres.' })
	@IsOptional()
	/* @IsNotEmpty({ message: 'El valor de la propiedad principal es requerida.' }) */
	mainAttributeValue: string;
	
	@IsObject({ message: 'La unidad debe ser un objeto válido.' })
	@IsNotEmpty({ message: 'La unidad es requerida.' })
	unitOfMeasure: { group: string; name: string; abbr: string };

	@MaxLength(50, { message: 'La condición debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'La condición debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La condición debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La condición es requerida.' })
	condition: string;
	
	@MaxLength(100, { message: 'La garantía debe tener máximo 100 caracteres.' })
	@MinLength(3, { message: 'La garantía debe tener minimo 3 caracteres.' })
	@IsString({ message: 'La garantía debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'La garantía es requerida.' })
	warranty: string;
    
    @ValidateNested()
    @Type(() => CountryDto)
	@IsObject({ message: 'El país debe ser un objeto válido' })
	@IsNotEmptyObject({}, { message: 'El país no puede ser nulo' })
	@IsNotEmpty({ message: 'El país es requerido.' })
    countryOfOrigin: CountryDto;
    
    @Min(0.01, { message: 'El precio regular debe ser mayor a 0.' })
	@IsNumber(
        { allowInfinity: false, allowNaN: false },
        { message: 'El precio regular debe ser un número válido.' }
    )
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsNotEmpty({ message: 'El precio regular es requerido.' })
    priceRegular: number;
    
    @Min(0.01, { message: 'El precio con descuento debe ser mayor a 0.' })
	@IsNumber(
        { allowInfinity: false, allowNaN: false },
        { message: 'El precio con descuento debe ser un número válido.' }
    )
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsOptional()
	priceDiscount: number;
    
    @ArrayMaxSize(20, { message: 'Máximo se permiten 20 etiquetas.' })
	@IsString({ each: true, message: 'Cada etiqueta debe ser una cadena de texto.' })
	@IsArray({ message: 'Las etiquetas deben ser un arreglo.' })
    tags?: string[];

    @IsUUID('4', { message: 'La marca debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La marca es requerida.' })
    brandId?: string;
    
    @IsUUID('4', { message: 'La categoría debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La categoría es requerida.' })
    categoryId?: string;
    
    @IsUUID('4', { message: 'La subcategoría debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La subcategoría es requerida.' })
    subcategoryId?: string;

    
	
    @IsBoolean({ message: 'El campo “Más vendido” debe ser verdadero o falso.' })
	@IsNotEmpty({ message: 'El campo “Más vendido” es requerido.' })
	@TransformBoolean()
    isBestSeller?: boolean;

	@IsBoolean({ message: 'El campo “Nuevo en catálogo” debe ser verdadero o falso.' })
    @IsNotEmpty({ message: 'El campo “Nuevo en catálogo” es requerido.' })
	@TransformBoolean()
    isNewArrival?: boolean;

	@IsBoolean({ message: 'El campo “Destacado” debe ser verdadero o falso.' })
    @IsNotEmpty({ message: 'El campo “Destacado” es requerido.' })
	@TransformBoolean()
    isFeatured?: boolean;

	@IsBoolean({ message: 'El campo “Edición limitada” debe ser verdadero o falso.' })
    @IsNotEmpty({ message: 'El campo “Edición limitada” es requerido.' })
	@TransformBoolean()
    isLimitedEdition?: boolean;

	@IsBoolean({ message: 'El campo “Preventa” debe ser verdadero o falso.' })
    @IsNotEmpty({ message: 'El campo “Preventa” es requerido.' })
	@TransformBoolean()
    isPreOrder?: boolean;

	@IsBoolean({ message: 'El campo “Exportable” debe ser verdadero o falso.' })
    @IsNotEmpty({ message: 'El campo “Exportable” es requerido.' })
	@TransformBoolean()
    isExportable?: boolean;

	@IsBoolean({ message: 'El campo “Permitir pedidos sin stock” debe ser verdadero o falso.' })
    @IsNotEmpty({ message: 'El campo “Permitir pedidos sin stock” es requerido.' })
	@TransformBoolean()
    allowBackorder?: boolean;
    
    @ValidateNested({ each: true })
    @Type(() => ProductAttributeDto)
	@IsArray({ message: 'Los atributos deben ser un arreglo.' })
	@Transform(({ value }) => {
    	if (typeof value === 'string') {
			try {
				return JSON.parse(value); // convierte string → array
			} catch (e) {
				return []; // evita romper la validación
			}
		}
		return value;
	})
	@IsOptional()
    attributes?: ProductAttributeDto[];
    /* o.boolDimensions === false */
	// ---------- DIMENSION UNIT ----------
	@ValidateIf(o => o.boolDimensions === 'true')
	@IsObject({ message: 'La unidad de dimensión debe ser un objeto válido.' })
	@IsNotEmpty({ message: 'La unidad de dimensión es requerida.' })
	dimensionUnit?: { group: string; name: string; abbr: string };

	// ---------- WEIGHT ----------
	@ValidateIf(o => o.boolDimensions === 'true')
	@Min(0.01, { message: 'El peso debe ser mayor a 0.' })
	@IsNumber(
		{ allowInfinity: false, allowNaN: false },
		{ message: 'El peso debe ser un número válido.' }
	)
	@Transform(({ value }) => value !== undefined ? Number(value) : value)
	@IsNotEmpty({ message: 'El peso es requerido.' })
	weight?: number;

	// ---------- WEIGHT UNIT ----------
	@ValidateIf(o => o.boolDimensions === 'true')
	@IsObject({ message: 'La unidad de peso debe ser un objeto válido.' })
	@IsNotEmpty({ message: 'La unidad de peso es requerida.' })
	weightUnit?: { group: string; name: string; abbr: string };

    // ---------- HEIGHT ----------
    @ValidateIf(o => o.boolDimensions === 'true')
    @Min(0.01, { message: 'La altura debe ser mayor a 0.' })
    @IsNumber(
        { allowInfinity: false, allowNaN: false },
        { message: 'La altura debe ser un número válido.' }
    )
    @Transform(({ value }) => value !== undefined ? Number(value) : value)
    @IsNotEmpty({ message: 'El alto es requerido.' })
    height?: number;

    // ---------- WIDTH ----------
    @ValidateIf(o => o.boolDimensions === 'true')
    @Min(0.01, { message: 'El ancho debe ser mayor a 0.' })
    @IsNumber(
        { allowInfinity: false, allowNaN: false },
        { message: 'El ancho debe ser un número válido.' }
    )
    @Transform(({ value }) => value !== undefined ? Number(value) : value)
    @IsNotEmpty({ message: 'El ancho es requerido.' })
    width?: number;

    // ---------- LENGTH ----------
    @ValidateIf(o => o.boolDimensions === 'true')
    @Min(0.01, { message: 'El largo debe ser mayor a 0.' })
    @IsNumber(
        { allowInfinity: false, allowNaN: false },
        { message: 'El largo debe ser un número válido.' }
    )
    @Transform(({ value }) => value !== undefined ? Number(value) : value)
    @IsNotEmpty({ message: 'El largo es requerido.' })
    length?: number;
	
	@MaxLength(50, { message: 'El material debe tener máximo 50 caracteres.' })
	@IsString({ message: 'El material debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El material es requerido.' })
	material?: string;

    @IsObject({ message: 'La unidad de temperatura debe ser un objeto válido.' })
	@IsOptional()
	storageTempUnit: { name: string; abbr: string };

	@IsNumber(
		{ allowInfinity: false, allowNaN: false },
		{ message: 'La temperatura mínima debe ser un número válido.' }
	)
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsOptional()
	minStorageTemp: number;

	@IsNumber(
		{ allowInfinity: false, allowNaN: false },
		{ message: 'La temperatura máxima debe ser un número válido.' }
	)
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsOptional()
	maxStorageTemp: number;

	@IsBoolean({ message: 'El campo “Es frágil” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Es frágil” es requerido.' })
	isFragile?: boolean;

	@IsBoolean({ message: 'El campo “Es perecible” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Es perecible” es requerido.' })
	isPerishable?: boolean;

	@IsBoolean({ message: 'El campo “Es ecológico” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Es ecológico” es requerido.' })
	isEcoFriendly?: boolean;

	@IsBoolean({ message: 'El campo “Es biodegradable” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Es biodegradable” es requerido.' })
	isBiodegradable?: boolean;
	
	@IsBoolean({ message: 'El campo “Es peligroso” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Es peligroso” es requerido.' })
	isHazardous?: boolean;

	@IsBoolean({
		message: 'El campo “Requiere refrigeración” debe ser verdadero o falso.',
	})
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Requiere refrigeración” es requerido.' })
	isRequiresRefrigeration?: boolean;
	
	@IsBoolean({ message: 'El campo “Es flamable” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Es flamable” es requerido.' })
	isFlammable?: boolean;

	@IsNotEmpty({ message: 'El campo “Requiere ensamblaje” es requerido.' })
	@TransformBoolean()
	@IsBoolean({
		message: 'El campo “Requiere ensamblaje” debe ser verdadero o falso.',
	})
	isRequiresAssembly?: boolean;

	@IsBoolean({ message: 'El campo “Envío gratis” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El campo “Envío gratis” es requerido.' })
	freeShipping?: boolean;
    
    
   	@Min(1, { message: 'Los días de preparación deben ser mayor a 0.' })
	@IsInt({ message: 'Los días de preparación deben ser un número entero.' })
	@IsNumber(
		{ allowInfinity: false, allowNaN: false },
		{ message: 'Los días de preparación deben ser un número válido.' }
	)
	@Transform(({ value }) => (value !== undefined ? Number(value) : value))
	@IsNotEmpty({ message: 'Los días de preparación son requeridos.' })
	handlingDays: number;
	
	@MaxLength(50, { message: 'El tipo de paquete debe tener máximo 50 caracteres.' })
	@IsString({ message: 'El tipo de paquete debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El tipo de paquete es requerido.' })
	packageType: string;

	
	@IsBoolean({ message: 'El campo “Recojo en tienda” debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsOptional()
	pickupInStore?: boolean;

	
	@IsString({ message: 'Las instrucciones especiales deben ser una cadena de texto.' })
	@IsOptional()
	specialInstructions?: string;

	@ValidateNested({ each: true })
    @Type(() => VariationDto)
	/* @ArrayMinSize(1, { message: 'Debe haber al menos 1 variacion.' }) */
	@IsArray({ message: 'Los variaciones deben ser un arreglo.' })
	@Transform(({ value }) => {
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				return parsed;
			} catch (e) {
				return [];
			}
		}
		return value;
	})
	@IsOptional()
    variations?: VariationDto[];

	boolDimensions: boolean;

}

