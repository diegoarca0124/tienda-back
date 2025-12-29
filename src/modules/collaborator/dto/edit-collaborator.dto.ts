import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class TypeDocument {
	@IsString({ message: 'El nombre del documento es requerido' })
	@IsNotEmpty({ message: 'El nombre del documento no puede estar vacío' })
	name: string;

	@IsString({ message: 'El valor del documento es requerido' })
	@IsNotEmpty({ message: 'El valor del documento no puede estar vacío' })
	value: string;
}

export class EditCollaboratorDto {
	@MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El nombre debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El nombre debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	readonly names: string;

	@MaxLength(50, { message: 'El apellido debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El apellido debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El apellido debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El apellido es obligatorio' })
	readonly surname: string;

	@MaxLength(20, { message: 'El telefono debe tener máximo 20 caracteres.' })
	@MinLength(3, { message: 'El telefono debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El telefono debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El telefono es obligatorio' })
	readonly phone: string;

	@IsIn(['DEFAULT'], {
		message: 'El rol no es un valor válido',
	})
	@MaxLength(20, { message: 'El rol debe tener máximo 20 caracteres.' })
	@MinLength(3, { message: 'El rol debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El rol debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El rol es obligatorio' })
	readonly role: string;

	@IsOptional()
	readonly fullnames?: string;

	@MaxLength(50, { message: 'El correo debe tener máximo 50 caracteres.' })
	@MinLength(3, { message: 'El correo debe tener minimo 3 caracteres.' })
	@IsEmail({}, { message: 'El correo no tiene un formato correcto.' })
	@IsNotEmpty({ message: 'El correo es obligatorio' })
	readonly email: string;

	@IsNotEmptyObject({}, { message: 'El tipo de documento no puede ser nulo' })
	@IsObject({ message: 'El tipo de documento debe ser un objeto válido' })
	@ValidateNested()
	@Type(() => TypeDocument)
	type_document: TypeDocument;
	
	@MaxLength(25, { message: 'El número de documento debe tener máximo 25 caracteres.' })
	@MinLength(3, { message: 'El número de documento debe tener minimo 3 caracteres.' })
	@IsString({ message: 'El número de documento debe ser una cadena de caracteres.' })
	@IsNotEmpty({ message: 'El número de documento es obligatorio' })
	readonly number_document: string;

	@MaxLength(20, { message: 'La contraseña debe tener máximo 20 caracteres.' })
	@MinLength(6, { message: 'La contraseña debe tener minimo 6 caracteres.' })
	@IsOptional()
	readonly password: string;

	readonly updatedAt?: Date;
}
