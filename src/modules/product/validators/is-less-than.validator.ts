import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsLessThan(property: string, validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			name: 'isLessThan',
			target: object.constructor,
			propertyName,
			constraints: [property],
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (value == null) return true;

					const relatedValue = (args.object as any)[args.constraints[0]];

					if (relatedValue == null) return true;

					return Number(value) < Number(relatedValue);
				},
			},
		});
	};
}
