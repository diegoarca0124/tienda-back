import { ArrayMaxSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateCatSubcatProductsDto {
	@IsUUID('4', { message: 'La categoría debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La categoría es requerida.' })
	categoryId?: string;

	@IsUUID('4', { message: 'La subcategoría debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'La subcategoría es requerida.' })
	subcategoryId?: string;

	@ArrayMaxSize(20, { message: 'Máximo se permiten 20 productos.' })
	@IsUUID('4', {
		each: true,
		message: 'Cada producto debe ser un UUID válido.',
	})
	@IsArray({ message: 'Los products deben ser un arreglo.' })
	products?: string[];
}
