import { ConflictException } from '@nestjs/common';

const messages: Record<string, string> = {
	UQ_ATTRIBUTE_GROUPS_NAME_NORMALIZED: 'Ya existe un grupo de atributos con ese nombre.',
	UQ_cbf1498cdad86915f4906d2da6b: 'Ya existe un grupo de atributos con ese nombre.',
	UQ_ATTRIBUTES_GROUP_NAME_NORMALIZED: 'Ya existe un atributo con ese nombre en el grupo seleccionado.',
	UQ_ATTRIBUTE_VALUES_NORMALIZED: 'Los valores del atributo no deben repetirse.',
	UQ_ATTRIBUTE_CATEGORIES_GROUP_CATEGORY: 'La categoría ya está asociada al grupo de atributos.',
};

export function rethrowAttributeUniqueViolation(error: unknown): void {
	if (!error || typeof error !== 'object') return;
	const databaseError = (error as any).driverError ?? error;
	if (databaseError.code !== '23505') return;
	const message = Object.prototype.hasOwnProperty.call(messages, databaseError.constraint) ? messages[databaseError.constraint] : undefined;
	if (message) throw new ConflictException(message);
}
