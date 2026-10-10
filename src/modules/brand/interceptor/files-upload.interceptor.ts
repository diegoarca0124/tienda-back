import { BadRequestException, CallHandler, ExecutionContext, Injectable, mixin, PayloadTooLargeException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as sharp from 'sharp';
import { DEFAULT_IMAGE_UPLOAD_CONFIG } from '@/common/constants/file-upload.constant';

sharp.cache(false); // 🔹 Desactiva caché de sharp para mejorar rendimiento en servidores con muchas imágenes

@Injectable()
export class FileUploadInterceptor {
	static fileInterceptor() {
		const UploadInterceptor = FileFieldsInterceptor(
			[
				{ name: 'logoUrl', maxCount: 1 },
				{ name: 'bannerUrl', maxCount: 1 },
			],
			{
				storage: memoryStorage(), // 📌 Ahora se almacena en memoria (buffer)
				limits: {
					fileSize: DEFAULT_IMAGE_UPLOAD_CONFIG.maxSizeBytes,
					files: DEFAULT_IMAGE_UPLOAD_CONFIG.maxFiles,
				},
				fileFilter: (req, file, cb) => {
					/* Se valida el formato dentro del interceptor*/
					cb(null, true);
				},
			}
		);

		class BrandUploadInterceptor extends UploadInterceptor {
			async intercept(context: ExecutionContext, next: CallHandler) {
				try {
					return await super.intercept(context, next);
				} catch (error) {
					if (error instanceof PayloadTooLargeException) {
						throw new PayloadTooLargeException(`Los archivos en la solicitud no estan permitidas.`);
					}

					throw error;
				}
			}
		}

		return mixin(BrandUploadInterceptor);
	}
}
