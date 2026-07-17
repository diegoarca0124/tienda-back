import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './client-s3.util';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

export async function deleteToS3(key: string) {
	console.log('process.env.AWS_S3_BUCKET', process.env.AWS_S3_BUCKET);

	await s3.send(
		new DeleteObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET,
			Key: key,
		})
	);
}
