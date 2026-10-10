import { ConflictException } from '@nestjs/common';

const messages: Record<string, string> = {
	UQ_CATEGORIES_NAME_NORMALIZED: 'Ya existe una categoría con ese nombre.',
	UQ_CATEGORIES_SLUG: 'Intenta con un nombre de categoría diferente: el slug ya existe.',
	UQ_SUBCATEGORIES_NAME_NORMALIZED: 'Ya existe una subcategoría con ese nombreEEEEWR.',
	UQ_SUBCATEGORIES_SLUG: 'Intenta con un nombre de subcategoría diferente: el slug ya existe.',
};

export function rethrowCategoryUniqueViolation(error: unknown): void {
	if (!error || typeof error !== 'object') return;
	const databaseError = (error as any).driverError ?? error;
	if (databaseError.code !== '23505') return;
	const message = Object.prototype.hasOwnProperty.call(messages, databaseError.constraint) ? messages[databaseError.constraint] : undefined;
	if (message) throw new ConflictException(message);
}
