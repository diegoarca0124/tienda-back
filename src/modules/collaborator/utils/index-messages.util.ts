import { ConflictException } from '@nestjs/common';

const messages: Record<string, string> = {
	UQ_COLLABORATOR_EMAIL: 'Ya existe una cuenta con ese correo.',
	UQ_COLLABORATOR_PHONE: 'Ya existe una cuenta con ese número de teléfono.',
	UQ_COLLABORATOR_DOCUMENT: 'Ya existe una cuenta con ese número de documento.',
};

export function rethrowCollaboratorUniqueViolation(error: unknown): void {
	if (!error || typeof error !== 'object') return;
	const databaseError = (error as any).driverError ?? error;
	if (databaseError.code !== '23505') return;
	const message = Object.prototype.hasOwnProperty.call(messages, databaseError.constraint)
		? messages[databaseError.constraint]
		: undefined;
	if (message) throw new ConflictException(message);
}
