import { ATTRIBUTE_VALUE_MAX_LENGTH } from '../constants/attribute-value.constant';
import { PickType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { normalizeText } from '@/common/utils/string.util';
import { CreateAttributeValueDto } from './create-attribute-value.dto';

export class CreateAttributeValuesDto extends PickType(CreateAttributeValueDto, ['attributeId'] as const) {
	@IsDefined({ message: 'Los valores son obligatorios.' })
	@IsArray({ message: 'Los valores deben ser una lista.' })
	@ArrayNotEmpty({ message: 'Debe proporcionar al menos un valor.' })
	@ArrayMaxSize(100, { message: 'Solo puede agregar hasta 100 valores a la vez.' })
	@ArrayUnique((value: unknown) => (typeof value === 'string' ? value.toLowerCase() : value), { message: 'Los valores del atributo no deben repetirse.' })
	@IsString({ each: true, message: 'Cada valor debe ser una cadena de caracteres.' })
	@IsNotEmpty({ each: true, message: 'Los valores no pueden estar vacíos.' })
	@MaxLength(ATTRIBUTE_VALUE_MAX_LENGTH, { each: true, message: 'Cada valor debe tener máximo 100 caracteres.' })
	@Transform(({ value }) => (Array.isArray(value) ? value.map((entry) => (typeof entry === 'string' ? normalizeText(entry) : entry)) : value))
	readonly values: string[];
}
