import { capitalizeWords } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsDefined, IsString, IsNotEmpty, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateAttributeValueDto {
	@IsNotEmpty({ message: 'El valor es obligatorio' })
	@IsDefined({ message: 'El valor es obligatorio.' })
	@IsString({ message: 'El valor debe ser una cadena de caracteres' })
	@MinLength(1, { message: 'El valor debe tener al menos 1 caracteres' })
	@MaxLength(100, { message: 'El valor no puede tener más de 100 caracteres' })
	@Transform(({ value }) => (typeof value === 'string' ? capitalizeWords(value) : value))
	value: string;

	@IsDefined({ message: 'El atributo es obligatorio.' })
	@IsNotEmpty({ message: 'El atributo no debe estar vacío.' })
	@IsUUID('4', { message: 'El atributo debe ser un UUID válido.' })
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	attributeId: string;
}
