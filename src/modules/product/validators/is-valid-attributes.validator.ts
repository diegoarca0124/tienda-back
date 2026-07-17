import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidAttributes(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isValidAttributes',
			target: object.constructor,
			propertyName,
			options: validationOptions,
			validator: {
				validate(value: any) {
					if (!Array.isArray(value)) {
						return false;
					}

					return value.every(
						(item) =>
							item &&
							typeof item === 'object' &&
							typeof item.attributeId === 'string' &&
							item.attributeId.trim() &&
							typeof item.attributeValueId === 'string' &&
							item.attributeValueId.trim() &&
							typeof item.value === 'string' &&
							item.value.trim() &&
							Object.keys(item).length === 3
					);
				},
			},
		});
	};
}
