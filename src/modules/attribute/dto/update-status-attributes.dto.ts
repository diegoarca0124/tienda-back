import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateStatusAttributesDto {
	@IsArray({ message: 'Los atributos deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos un atributo.' })
	@IsUUID('4', { each: true, message: 'Cada ID de atributo debe ser un UUID válido.' })
	ids: string[];

	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El estado es requerido.' })
	status: boolean;
}
