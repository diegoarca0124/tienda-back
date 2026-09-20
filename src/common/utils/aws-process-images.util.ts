import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from './upload-to-s3.util';

const variants = [
	{
		dir: 'small',
		quality: 70,
		scale: 0.2,
	},
	{
		dir: 'medium',
		scale: 0.5,
		quality: 70,
	},
	{
		dir: 'large',
		scale: 0.7,
		quality: 70,
	},
] as const;

export async function awsProcessImages(
	files: Express.Multer.File[],
	folder: string,
	fileNames?: string[]
): Promise<
	Array<{
		originalName: string;
		newName: string;
	}>
> {
	const results: Array<{
		originalName: string;
		newName: string;
	}> = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (!file?.buffer?.length) {
			throw new Error(`El archivo ${file?.originalname || i + 1} está vacío.`);
		}

		const filename = fileNames?.[i] ? fileNames[i] : `${uuidv4()}.webp`;

		const normalizedBuffer = await sharp(file.buffer, { failOn: 'error' }).rotate().toBuffer();
		const image = sharp(normalizedBuffer);
		const metadata = await image.metadata();
		const originalWidth = metadata.width;
		const originalHeight = metadata.height;
		if (!originalWidth || !originalHeight) {
			throw new Error(`No fue posible determinar las dimensiones de ${file.originalname}.`);
		}

		await Promise.all(
			variants.map(async (variant) => {
				const width = Math.max(1, Math.round(originalWidth * variant.scale));
				const buffer = await image
					.clone()
					.resize({ width, withoutEnlargement: true })
					.webp({ quality: variant.quality })
					.toBuffer();

				return uploadToS3(buffer, filename, 'image/webp', `${folder}/${variant.dir}`);
			})
		);

		results.push({
			originalName: file.originalname,
			newName: filename,
		});
	}

	return results;
}
