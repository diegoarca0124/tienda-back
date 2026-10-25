import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateAttributeStatusDto {
	@IsDefined({ message: 'El estado del atributo es obligatorio.' })
	@IsBoolean({ message: 'El estado del atributo debe ser verdadero o falso.' })
	status: boolean;
}
