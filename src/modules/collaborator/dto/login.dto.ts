import { normalizeText } from '@/common/utils/string.util';
import { Transform } from 'class-transformer';
import { IsString, IsEmail, MinLength, IsDefined, IsNotEmpty } from 'class-validator';

export class LoginDto {
	@Transform(({ value }) => (typeof value === 'string' ? normalizeText(value) : value))
	@IsDefined({ message: 'El correo es obligatorio.' })
	@IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
	@IsNotEmpty({ message: 'El correo no debe estar vacío.' })
	readonly email: string;

	@IsDefined({ message: 'La contraseña es obligatoria.' })
	@IsString({ message: 'La contraseña debe ser una cadena de caracteres.' })
	@MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres.' })
	@IsNotEmpty({ message: 'La contraseña no debe estar vacía.' })
	readonly password: string;
}
