import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateAttributeGroupStatusDto {
	@IsDefined({ message: 'El estado del grupo de atributos es obligatorio.' })
	@IsBoolean({ message: 'El estado del grupo de atributos debe ser verdadero o falso.' })
	status: boolean;
}
