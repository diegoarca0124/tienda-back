import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateBrandsStatusDto {
	@IsArray({ message: 'Las marcas deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una marca.' })
	@IsUUID('4', { each: true, message: 'Cada ID de marca debe ser un UUID válido.' })
	@ArrayMaxSize(20, {
		message: 'Solo puede actualizar hasta 20 marcas.',
	})
	ids: string[];

	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El estado es requerido.' })
	status: boolean;
}
