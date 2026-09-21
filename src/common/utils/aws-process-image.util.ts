import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from './upload-to-s3.util';
import { deleteToS3 } from './delete-to-s3.util';

const variants = [
	{
		folder: 'small',
		scale: 0.2,
		quality: 70,
	},
	{
		folder: 'medium',
		scale: 0.5,
		quality: 70,
	},
	{
		folder: 'large',
		scale: 0.7,
		quality: 70,
	},
];

export async function awsProcessImage(file: Express.Multer.File, baseFolder: string): Promise<string> {
	if (!file?.buffer?.length) {
		throw new Error('El archivo de imagen está vacío.');
	}

	const filename = `${uuidv4()}.webp`;
	const uploadedKeys: string[] = [];

	try {
		const image = sharp(file.buffer, {
			failOn: 'error',
		}).rotate();

		const metadata = await image.metadata();

		if (!metadata.width || !metadata.height) {
			throw new Error('No se pudieron obtener las dimensiones de la imagen.');
		}

		for (const variant of variants) {
			const width = Math.max(1, Math.round(metadata.width * variant.scale));

			const buffer = await image
				.clone()
				.resize({
					width,
					withoutEnlargement: true,
				})
				.webp({
					quality: variant.quality,
				})
				.toBuffer();

			const key = await uploadToS3(buffer, filename, 'image/webp', `${baseFolder}/${variant.folder}`);

			uploadedKeys.push(key);
		}

		return filename;
	} catch (error) {
		await Promise.allSettled(uploadedKeys.map((key) => deleteToS3(key)));
		throw error;
	}
}
