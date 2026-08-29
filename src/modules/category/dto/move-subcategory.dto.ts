import { IsDefined, IsUUID } from 'class-validator';

export class MoveSubcategoryDto {
	@IsDefined({ message: 'La categoría es obligatoria.' })
	@IsUUID('4', { message: 'La categoría debe ser un UUID válido' })
	categoryId?: string;
}

//2247800 - 715s