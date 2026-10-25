import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateSubcategoriesStatusDto {
	@IsArray({ message: 'Las subcategorias deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una subcategoria.' })
	@ArrayMaxSize(20, {
		message: 'Solo puede actualizar hasta 20 colaboradores.',
	})
	@IsUUID('4', { each: true, message: 'Cada ID de categoria debe ser un UUID válido.' })
	ids: string[];

	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El estado es requerido.' })
	status: boolean;
}
