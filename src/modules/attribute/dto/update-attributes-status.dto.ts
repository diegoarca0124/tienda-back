import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsDefined, IsUUID } from 'class-validator';

export class UpdateAttributesStatusDto {
	@IsDefined({ message: 'Los atributos son obligatorios.' })
	@IsArray({ message: 'Los atributos deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos un atributo.' })
	@ArrayMaxSize(20, { message: 'Solo puede actualizar hasta 20 atributos.' })
	@IsUUID('4', { each: true, message: 'Cada ID de atributo debe ser un UUID válido.' })
	ids: string[];

	@IsDefined({ message: 'El estado es obligatorio.' })
	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	status: boolean;
}
