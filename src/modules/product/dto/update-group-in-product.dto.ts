import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateGroupInProductDto {
	@IsUUID('4', { message: 'El grupo de producto debe ser un UUID válido.' })
	@IsNotEmpty({ message: 'El grupo de producto es requerida.' })
	productGroupId: string;
}
