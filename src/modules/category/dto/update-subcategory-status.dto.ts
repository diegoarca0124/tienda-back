import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateSubcategoryStatusDto {
	@IsDefined({ message: 'El estado de la subcategoría es obligatorio.' })
	@IsBoolean({ message: 'El estado de la subcategoría debe ser verdadero o falso.' })
	status: boolean;
}
