import { TransformBoolean } from '@/common/decorators/transform-boolean.decorator';
import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateStatusSubcategoriesDto {
	@IsArray({ message: 'Las subcategorias deben ser un arreglo.' })
	@ArrayNotEmpty({ message: 'Debe seleccionar al menos una subcategoria.' })
	@IsUUID('4', { each: true, message: 'Cada ID de categoria debe ser un UUID válido.' })
	ids: string[];

	@IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
	@TransformBoolean()
	@IsNotEmpty({ message: 'El estado es requerido.' })
	status: boolean;
}
