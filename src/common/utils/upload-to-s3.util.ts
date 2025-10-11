import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
console.log('AWS_S3_PUBLIC_URL:', process.env.AWS_S3_PUBLIC_URL);

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

console.log('S3 initialized', s3.config.credentials);

export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string,
): Promise<string> {
  const key = `${folder}/${fileName}`;
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
       // para que sea accesible públicamente
    });

    await s3.send(command);

    console.log('✅ Upload successful:', key);

    return `${process.env.AWS_S3_PUBLIC_URL}/${key}`;
  } catch (err) {
    console.error('❌ Error uploading to S3:', err);
    throw err;
  }
}
