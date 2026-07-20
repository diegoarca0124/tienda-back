import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayNotEmpty, IsArray, IsBoolean, IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateCollaboratorsStatusDto {
	@IsDefined({ message: 'Los colaboradores son obligatorios.' })
	@IsArray({ message: 'Los colaboradores deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos un colaborador.' })
	@IsUUID('4', { each: true, message: 'Cada ID de colaborador debe ser un UUID válido.' })
	ids: string[];

	@IsDefined({ message: 'El estado es obligatorio.' })
	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	status: boolean;
}
