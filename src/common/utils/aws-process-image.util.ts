import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from './upload-to-s3.util';

const variants = [
    { dir: 'small', quality: 70, scale: 0.2 },
    { dir: 'medium', quality: 70, scale: 0.5 },
    { dir: 'large', quality: 70, scale: 0.7 },
] as const;

export async function awsProcessImage(
    file: Express.Multer.File,
    folder: string,
): Promise<string> {
    if (!file?.buffer?.length) {
        throw new Error('El archivo de imagen está vacío.');
    }

    const filename = `${uuidv4()}.webp`;
    const image = sharp(file.buffer, {
        failOn: 'error',
    }).rotate();

    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        throw new Error(
            'No fue posible determinar las dimensiones de la imagen.',
        );
    }

    await Promise.all(
        variants.map(async ({ dir, quality, scale }) => {
            const width = Math.max(
                1,
                Math.round(metadata.width! * scale),
            );

            const buffer = await image
                .clone()
                .resize({
                    width,
                    withoutEnlargement: true,
                })
                .webp({ quality })
                .toBuffer();

            await uploadToS3(
                buffer,
                filename,
                'image/webp',
                `${folder}/${dir}`,
            );
        }),
    );

    return filename;
}