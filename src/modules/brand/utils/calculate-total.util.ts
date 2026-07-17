import { ProductPhoto } from "@/entities/product-photo.entity";

export const calculateQuality = (product: any) => {
	let score = 0;

	// Nombre (0 - 20)
	score += calculateNameQuality(product.name);

	// Descripción (0 - 25)
	score += calculateDescriptionQuality(product.description);

	// Extracto (0 - 15)
	score += calculateExtractQuality(product.extract);

	// Tags (0 - 10)
	score += calculateTagsQuality(product.tags);

	// Características (0 - 15)
	score += calculateDescriptionsQuality(product.productDescriptions);

	// Imágenes (0 - 15)
	score += calculatePhotosQuality(product.productPhotos);

	return {
		score,
		label: getQualityLabel(score),
	};
};

export const getQualityLabel = (score: number): 'low' | 'medium' | 'high' => {
	if (score <= 39)
		return 'low';

	if (score <= 64)
		return 'medium';

	return 'high';
};

const calculateNameQuality = (name: string): number => {
	if (!name)
		return 0;

	const value = name.trim();
	const words = value.split(/\s+/).length;

	let score = 0;

	// ==================================
	// Longitud (10 puntos)
	// Ideal: 20 - 80 caracteres
	// ==================================
	if (value.length >= 20 && value.length <= 80)
		score += 10;
	else if (value.length >= 10)
		score += 6;

	// ==================================
	// Número de palabras (5 puntos)
	// Ideal: 4 - 10 palabras
	// ==================================
	if (words >= 4 && words <= 10)
		score += 5;
	else if (words >= 2)
		score += 3;

	// ==================================
	// Sin caracteres extraños (5 puntos)
	// Evita símbolos innecesarios para
	// mejorar legibilidad y SEO
	// ==================================
	const strangeChars = /[!@#$%^&*()+=<>{}[\]|\\]/;

	if (!strangeChars.test(value))
		score += 5;

	return score;
};

const calculateDescriptionQuality = (description: string): number => {
	if (!description)
		return 0;

	// Eliminar HTML
	const text = description
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	if (!text)
		return 0;

	const characters = text.length;
	const words = text.split(' ').filter(Boolean).length;

	let score = 0;

	// ==========================
	// Caracteres (10)
	// Ideal: 200 - 1000
	// ==========================
	if (characters >= 200 && characters <= 1000)
		score += 10;
	else if (characters >= 120 && characters < 200)
		score += 6;
	else if (characters > 1000)
		score += 4;

	// ==========================
	// Palabras (5)
	// Ideal: 30 - 180
	// ==========================
	if (words >= 30 && words <= 180)
		score += 5;
	else if (words >= 15)
		score += 3;

	// ==========================
	// Caracteres extraños (4)
	// ==========================
	const strangeChars = /[^\p{L}\p{N}\s.,;:¡!¿?()"%&+/\-]/gu;

	if (!strangeChars.test(text))
		score += 4;

	// ==========================
	// Calidad del texto (6)
	// ==========================
	const repeatedCharacters = /(.)\1{4,}/;

	if (
		!repeatedCharacters.test(text) &&
		!/\s{2,}/.test(text)
	)
		score += 6;

	return score;
};

const calculateExtractQuality = (extract: string): number => {
	if (!extract)
		return 0;

	const text = extract
		.replace(/\s+/g, ' ')
		.trim();

	if (!text)
		return 0;

	const characters = text.length;
	const words = text.split(' ').filter(Boolean).length;

	let score = 0;

	// ==================================
	// Caracteres (0 - 6)
	// Ideal: 60 - 180 (máximo BD: 250)
	// ==================================
	if (characters >= 60 && characters <= 180)
		score += 6;
	else if (characters >= 40)
		score += 4;
	else if (characters >= 20)
		score += 2;

	// ==================================
	// Palabras (0 - 3)
	// Ideal: 10 - 30
	// ==================================
	if (words >= 10 && words <= 30)
		score += 3;
	else if (words >= 5)
		score += 2;

	// ==================================
	// Sin caracteres extraños (0 - 3)
	// ==================================
	const strangeChars = /[^\p{L}\p{N}\s.,;:¡!¿?()"%&+/\-]/gu;

	if (!strangeChars.test(text))
		score += 3;

	// ==================================
	// Calidad del formato (0 - 3)
	// ==================================
	const repeatedCharacters = /(.)\1{4,}/;

	if (
		!repeatedCharacters.test(text) &&
		!/\s{2,}/.test(text)
	)
		score += 3;

	return score;
};

const calculateTagsQuality = (tags: string[]): number => {
	if (!tags?.length)
		return 0;

	if (tags.length >= 6)
		return 15;

	if (tags.length >= 4)
		return 10;

	if (tags.length >= 2)
		return 5;

	return 0;
};

const calculateDescriptionsQuality = (descriptions: any[]): number => {
	const total = descriptions?.length ?? 0;

	if (total >= 10)
		return 15;

	if (total >= 7)
		return 12;

	if (total >= 5)
		return 9;

	if (total >= 3)
		return 6;

	if (total >= 1)
		return 3;

	return 0;
};

const calculatePhotosQuality = (photos: ProductPhoto[]): number => {
	const total = photos?.length ?? 0;

	if (total >= 5)
		return 15;

	if (total === 4)
		return 12;

	if (total === 3)
		return 9;

	if (total === 2)
		return 6;

	if (total === 1)
		return 3;

	return 0;
};