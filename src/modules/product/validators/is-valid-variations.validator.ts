import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsValidVariations(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isValidVariations',
			target: object.constructor,
			propertyName,
			options: validationOptions,
			validator: {
				validate(value: any) {
					if (!Array.isArray(value)) {
						return false;
					}

					return value.every((v) => v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim().length >= 3 && Object.keys(v).length === 1);
				},
			},
		});
	};
}
