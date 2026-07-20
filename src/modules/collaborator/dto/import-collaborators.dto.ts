import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateCollaboratorDto } from './create-collaborator.dto';
import { OmitType } from '@nestjs/mapped-types';
import { ALLOWED_PREFIX } from '../constants/allowed-prefix.constant';

export class ValidateImportCollaboratorDto extends OmitType(CreateCollaboratorDto, ['password'] as const) {
	static REQUIRED_FIELDS = ['names', 'surname', 'email', 'prefix', 'phone', 'role', 'type_document', 'number_document', 'status'];

	@IsString({ message: 'El prefijo debe ser una cadena de texto.' })
	@IsNotEmpty({ message: 'El prefijo es obligatorio.' })
	@IsIn(ALLOWED_PREFIX, { message: 'El prefijo no es válido.' })
	prefix?: string;
}

export class ImportCollaboratorsDto {
	@IsArray({ message: 'Debe enviar un arreglo de registros.' })
	data: any[];

	@IsIn(['news', 'upsert', 'update'], {
		message: 'El modo no es un valor válido',
	})
	@IsString({ message: 'El modo debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El modo no debe estar vacio.' })
	@IsDefined({ message: 'El modo es obligatorio.' })
	readonly mode: string;

	@IsIn(['email', 'number_document'], {
		message: 'El identificador no es un valor válido',
	})
	@IsString({ message: 'El identificador debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El identificador no debe estar vacio.' })
	@IsDefined({ message: 'El identificador es obligatorio.' })
	readonly identifyBy: string;
}
