import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateCollaboratorStatusDto {
  @IsDefined({ message: 'El estado del colaborador es obligatorio.' })
  @IsBoolean({ message: 'El estado del colaborador debe ser verdadero o falso.' })
  status: boolean;
}