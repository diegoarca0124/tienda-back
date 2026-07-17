export const normalizeText = (value: string): string => {
	if (!value || typeof value !== 'string') {
		return value;
	}

	return value.trim().replace(/\s+/g, ' ');
};

export const normalizeNumber = (value: string): string => {
	if (value === null || value === undefined) {
		return value;
	}

	return String(value) // 👈 fuerza conversión a string
		.trim()
		.replace(/\s+/g, '')
		.replace(/[^\d]/g, ''); // 👈 elimina TODO lo que no sea dígito (incluye invisibles)
};

export const capitalizeWords = (value: string): string => {
	return normalizeText(value)
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};
