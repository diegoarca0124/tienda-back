import {
	IsString,
	IsEmail,
	MinLength,
	IsOptional,
	IsInt,
	MaxLength,
	IsStrongPassword,
	Validate,
} from 'class-validator';

export class LoginDto {
	@IsEmail({}, { message: 'El correo electrónico debe ser válido' })
	readonly email: string;

	@IsString({ message: 'La contraseña debe ser una cadena de caracteres' })
	@MinLength(6, { message: 'La contraseña deben tener minimo 6 caracteres.' })
	readonly password: string;
}
