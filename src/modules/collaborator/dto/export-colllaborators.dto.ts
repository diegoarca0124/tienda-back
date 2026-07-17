import { Type } from 'class-transformer';
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsDefined,
	IsIn,
	IsNotEmpty,
	IsNotEmptyObject,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	ValidateIf,
	ValidateNested,
} from 'class-validator';

export class ExportFieldDto {
	@IsString({ message: 'El campo debe ser una cadena de texto.' })
	@IsNotEmpty({ message: 'El campo es obligatorio.' })
	@IsIn(['names', 'surname', 'type_document', 'number_document', 'email', 'phone', 'role', 'createdAt', 'updatedAt', 'statusAt', 'lastDateLogin', 'status', 'prefix'], {
		message: 'El campo no es válido para exportación.',
	})
	field: string;

	@IsBoolean({ message: 'El estado del campo debe ser verdadero o falso.' })
	checked: boolean;
}

export class ExportCollaboratorsDto {
	@IsString({ message: 'El formato debe ser texto.' })
	@IsNotEmpty({ message: 'El formato no debe estar vacio.' })
	@IsIn(['xlsx', 'csv'], { message: 'El formato debe ser xlsx o csv.' })
	@IsDefined({ message: 'El formato es obligatorio.' })
	format: string;

	@IsBoolean({ message: 'El enmascarado debe ser verdadero o falso.' })
	@IsDefined({ message: 'El enmascarado es obligatorio.' })
	maskData: boolean;

	@IsString({ message: 'El alcance debe ser texto.' })
	@IsNotEmpty({ message: 'El alcance no debe estar vacio.' })
	@IsIn(['all', 'selected', 'page'], {
		message: 'El alcance no es válido.',
	})
	@IsDefined({ message: 'El alcance es obligatorio.' })
	scope: string;

	@ValidateIf((o) => o.scope === 'selected' || o.scope === 'page')
	@IsDefined({ message: 'Debe enviar los IDs.' })
	@IsArray({ message: 'Los IDs deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe enviar al menos un registro.' })
	@IsUUID('4', { each: true, message: 'Cada ID debe ser un UUID válido.' })
	ids?: string[];

	@IsString({ message: 'El orden debe ser texto.' })
	@IsNotEmpty({ message: 'El orden no debe estar vacio.' })
	@MaxLength(50, { message: 'El orden no puede tener más de 50 caracteres.' })
	@IsDefined({ message: 'El orden es obligatorio.' })
	sort: string;

	@IsDefined({ message: 'Los campos son obligatorios.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos un campo.' })
	@IsArray({ message: 'Los campos deben ser un arreglo.' })
	@ValidateNested({ each: true })
	@Type(() => ExportFieldDto)
	data: ExportFieldDto[];
}
