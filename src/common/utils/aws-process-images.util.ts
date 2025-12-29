import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from './upload-to-s3.util';

export async function awsProcessImages(
  files: Express.Multer.File[],   // <--- ahora recibe múltiples archivos
  folder: string,
  scaleFactor: number,
  fileNames?: string[],           // <--- opcional: nombres personalizados
): Promise<string[]> {

  const results: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    let filename = fileNames?.[i] 
      ? fileNames[i] 
      : `${uuidv4()}.webp`;

    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    const newWidth = Math.round(metadata.width! * scaleFactor);
    const newHeight = Math.round(metadata.height! * scaleFactor);

    const buffer = await image
      .resize(newWidth, newHeight)
      .webp({ quality: 70 })
      .toBuffer();

    const url = await uploadToS3(buffer, filename, 'image/webp', folder);

    results.push(url);
  }

  return results;
}
