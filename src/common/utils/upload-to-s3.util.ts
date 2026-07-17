import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';
import { s3 } from './client-s3.util';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

console.log('S3 initialized', s3.config.credentials);

export async function uploadToS3(buffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string> {
	const key = `${folder}/${fileName}`;
	try {
		const command = new PutObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET!,
			Key: key,
			Body: buffer,
			ContentType: mimeType,
		});

		await s3.send(command);
		return `${key}`;
	} catch (err) {
		throw err;
	}
}
