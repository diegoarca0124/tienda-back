import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsDefined, IsUUID } from 'class-validator';

export class UpdateAttributeGroupsStatusDto {
	@IsDefined({ message: 'Los grupos de atributos son obligatorios.' })
	@IsArray({ message: 'Los grupos de atributos deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos un grupo de atributos.' })
	@ArrayMaxSize(20, { message: 'Solo puede actualizar hasta 20 grupos de atributos.' })
	@IsUUID('4', { each: true, message: 'Cada ID de grupo de atributos debe ser un UUID válido.' })
	ids: string[];

	@IsDefined({ message: 'El estado es obligatorio.' })
	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	status: boolean;
}
