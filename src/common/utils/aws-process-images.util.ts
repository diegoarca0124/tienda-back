import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from './upload-to-s3.util';

const dimensions = [
	{
		type: 'small',
		dir: 'small',
		quality: 70,
		scale: 0.2,
	},
	{
		type: 'medium',
		dir: 'medium',
		scale: 0.5,
		quality: 70,
	},
	{
		type: 'large',
		dir: 'large',
		scale: 0.7,
		quality: 70,
	},
];

export async function awsProcessImages(
	files: Express.Multer.File[],
	folder: string,
	scaleFactor: number,
	fileNames?: string[]
): Promise<
	Array<{
		originalName: string;
		newName: string;
	}>
> {
	let results: Array<{
		originalName: string;
		newName: string;
	}> = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		const filename = fileNames?.[i] ? fileNames[i] : `${uuidv4()}.webp`;

		const image = sharp(file.buffer);
		const metadata = await image.metadata();

		await Promise.all(
			dimensions.map(async (element) => {
				const newWidth = Math.round(metadata.width! * element.scale);
				const newHeight = Math.round(metadata.height! * element.scale);

				const buffer = await image.resize(newWidth, newHeight).webp({ quality: element.quality }).toBuffer();

				return uploadToS3(buffer, filename, 'image/webp', `${folder}/${element.dir}`);
			})
		);

		results.push({
			originalName: file.originalname,
			newName: filename,
		});
	}

	return results;
}
