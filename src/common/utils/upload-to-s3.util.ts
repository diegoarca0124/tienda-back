import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './client-s3.util';

export async function uploadToS3(buffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string> {
	const key = `${folder}/${fileName}`;

	await s3.send(
		new PutObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET!,
			Key: key,
			Body: buffer,
			ContentType: mimeType,
			CacheControl: 'public, max-age=31536000, immutable',
		})
	);

	return key;
}
