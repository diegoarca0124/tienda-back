export const CreateCollaboratorSanitize = (item: any) => {
	return {
		...item,
		names: item.names?.trim().replace(/\s+/g, ' ').toUpperCase(),

		surname: item.surname?.trim().replace(/\s+/g, ' ').toUpperCase(),

		fullnames: `${item.names ?? ''} ${item.surname ?? ''}`.trim().replace(/\s+/g, ' ').toUpperCase(),

		email: item.email?.trim().toLowerCase(),

		number_document: item.number_document?.trim(),

		phone: item.phone?.trim(),
	};
};
