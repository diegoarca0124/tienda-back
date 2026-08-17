import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateCategoryStatusDto {
	@IsDefined({ message: 'El estado de la categoría es obligatorio.' })
	@IsBoolean({ message: 'El estado de la categoría debe ser verdadero o falso.' })
	status: boolean;
}
