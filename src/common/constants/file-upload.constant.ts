export interface ImageUploadConfig {
	readonly allowedMimeTypes: readonly string[];
	readonly maxSizeBytes: number;
	readonly maxFiles: number;
}

const MEGABYTE = 1024 * 1024;

export const DEFAULT_IMAGE_UPLOAD_CONFIG: ImageUploadConfig = {
	allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'],
	maxSizeBytes: 3 * MEGABYTE,
	maxFiles: 2,
};
