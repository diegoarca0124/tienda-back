import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from './upload-to-s3.util';

export async function awsProcessImage(
  file: Express.Multer.File,
  folder: string,      // <--- carpeta que quieres pasar
  scaleFactor: number,
  fileName?: string, 
): Promise<string> {
  /* const fileName = `${uuidv4()}.webp`; */
  let filename : any =  `${fileName}`;
  if(!fileName) filename =  `${uuidv4()}.webp`;

  const image = sharp(file.buffer);
  const metadata = await image.metadata();

  const newWidth = Math.round(metadata.width! * scaleFactor);
  const newHeight = Math.round(metadata.height! * scaleFactor);

  const buffer = await image
    .resize(newWidth, newHeight)
    .webp({ quality: 70 })
    .toBuffer();

  // Aquí pasas la carpeta al subir a S3
  const url = await uploadToS3(buffer, filename, 'image/webp', folder);

  return url;
}
