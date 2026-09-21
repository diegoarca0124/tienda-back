import { deleteToS3 } from './delete-to-s3.util';

const IMAGE_VARIANTS = ['small', 'medium', 'large'] as const;

export async function deleteImageVariants(folder: string, filename?: string | null): Promise<void> {
	if (!filename?.trim()) return;
	const keys = IMAGE_VARIANTS.map((variant) => `${folder}/${variant}/${filename}`);
	await Promise.all(keys.map((key) => deleteToS3(key)));
}
