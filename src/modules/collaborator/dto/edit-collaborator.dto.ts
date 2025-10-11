import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EditCollaboratorDto {
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres.' })
	readonly names: string;

	@IsString({ message: 'Los apellidos deben ser una cadena de caracteres.' })
	@MinLength(3, { message: 'Los apellidos deben tener minimo 3 caracteres.' })
	@MaxLength(50, { message: 'Los apellidos deben tener máximo 50 caracteres.' })
	readonly surname: string;

	@IsString({ message: 'El telefono debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El telefono debe tener minimo 3 caracteres.' })
	@MaxLength(20, { message: 'El telefono debe tener máximo 20 caracteres.' })
	readonly phone: string;

	@IsString({ message: 'El rol debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El rol debe tener minimo 3 caracteres.' })
	@MaxLength(20, { message: 'El rol debe tener máximo 20 caracteres.' })
	@IsIn(['DEFAULT'], {
		message: 'El rol no es un valor válido',
	})
	readonly role: string;

	@IsOptional()
	readonly fullnames?: string;

	@IsEmail({}, { message: 'El correo no tiene un formato correcto.' })
	@MinLength(3, { message: 'El correo debe tener minimo 3 caracteres.' })
	@MaxLength(50, { message: 'El correo debe tener máximo 50 caracteres.' })
	readonly email: string;

	@IsString({ message: 'El tipo de documento debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El tipo de documento debe tener minimo 3 caracteres.' })
	@MaxLength(50, { message: 'El tipo de documento debe tener máximo 50 caracteres.' })
	readonly type_document: string;

	@IsString({ message: 'El documento de identidad debe ser una cadena de caracteres.' })
	@MinLength(3, { message: 'El documento de identidad debe tener minimo 3 caracteres.' })
	@MaxLength(25, { message: 'El documento de identidad debe tener máximo 25 caracteres.' })
	readonly number_document: string;

	@IsOptional()
	@MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres.' })
	@MaxLength(20, { message: 'La contraseña debe tener máximo 20 caracteres.' })
	readonly password?: string;

	readonly updatedAt?: Date;
}
