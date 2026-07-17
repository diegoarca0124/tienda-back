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

export async function awsProcessImage(
	file: Express.Multer.File,
	folder: string, // <--- carpeta que quieres pasar
	scaleFactor: number,
	fileName?: string
): Promise<string> {
	/* const fileName = `${uuidv4()}.webp`; */
	let filename: any = `${fileName}`;
	if (!fileName) filename = `${uuidv4()}.webp`;

	const image = sharp(file.buffer).rotate();
	const metadata = await image.metadata();

	await Promise.all(
		dimensions.map(async (element) => {
			const newWidth = Math.round(metadata.width! * element.scale);
			const newHeight = Math.round(metadata.height! * element.scale);

			const buffer = await image
			.clone()
			.resize(newWidth, newHeight)
			.webp({ quality: element.quality })
			.toBuffer();

			await uploadToS3(
				buffer,
				filename,
				'image/webp',
				`${folder}/${element.dir}`,
			);
		}),
	);

	return filename;
}
