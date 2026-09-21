import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './client-s3.util';

export async function deleteToS3(key: string): Promise<void> {
	await s3.send(
		new DeleteObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET!,
			Key: key,
		})
	);
}
