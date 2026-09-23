import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateBrandStatusDto {
    @IsDefined({ message: 'El estado de la marca es obligatorio.' })
    @IsBoolean({ message: 'El estado de la marca debe ser verdadero o falso.' })
    status: boolean;
}
