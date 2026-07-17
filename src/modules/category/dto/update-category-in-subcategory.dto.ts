import { IsUUID } from 'class-validator';

export class UpdateCategoryInSubcategoryDto {
	@IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
	categoryId?: string;
}
