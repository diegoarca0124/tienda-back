import { ConflictException } from '@nestjs/common';

const messages: Record<string, string> = {
	UQ_BRANDS_NAME_NORMALIZED: 'Ya existe una marca con ese nombre.',
	UQ_BRANDS_SLUG: 'Intenta con un nombre de marca diferente: el slug ya existe.',
	UQ_BRANDS_PREFIX_NORMALIZED: 'Ya existe una marca con ese prefijo.',
	// Support databases that have not applied the named-index migration yet.
	UQ_96db6bbbaa6f23cad26871339b6: 'Ya existe una marca con ese nombre.',
	UQ_b15428f362be2200922952dc268: 'Intenta con un nombre de marca diferente: el slug ya existe.',
	UQ_0f32d7302e55d3f297c08c1a859: 'Ya existe una marca con ese prefijo.',
};

export function rethrowBrandUniqueViolation(error: unknown): void {
	if (!error || typeof error !== 'object') return;
	const databaseError = (error as any).driverError ?? error;
	if (databaseError.code !== '23505') return;
	const message = Object.prototype.hasOwnProperty.call(messages, databaseError.constraint) ? messages[databaseError.constraint] : undefined;
	if (message) throw new ConflictException(message);
}
