import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export const IsValidDocumentNumber = (validationOptions?: ValidationOptions) => {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isValidDocumentNumber',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					const obj: any = args.object;

					if (!value) return false;

					switch (obj.type_document) {
						case 'DNI':
							return /^\d{8}$/.test(value);

						case 'CE - Carné de Extranjería':
							return /^[a-zA-Z0-9]{9,12}$/.test(value);

						case 'Pasaporte':
							return /^[a-zA-Z0-9]{6,12}$/.test(value);

						default:
							return false;
					}
				},

				defaultMessage(args: ValidationArguments) {
					const obj: any = args.object;

					switch (obj.type_document) {
						case 'DNI':
							return 'El DNI debe tener exactamente 8 dígitos.';
						case 'CE - Carné de Extranjería':
							return 'El CE debe tener entre 9 y 12 caracteres.';
						case 'Pasaporte':
							return 'El pasaporte debe tener entre 6 y 12 caracteres.';
						default:
							return 'El número de documento no es válido.';
					}
				},
			},
		});
	};
};
