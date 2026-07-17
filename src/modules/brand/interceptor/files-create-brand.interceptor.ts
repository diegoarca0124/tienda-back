import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor, UnsupportedMediaTypeException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as sharp from 'sharp';

sharp.cache(false); // 🔹 Desactiva caché de sharp para mejorar rendimiento en servidores con muchas imágenes

const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
];

@Injectable()
export class FileUploadInterceptor {
	static fileInterceptor() {
		return FileFieldsInterceptor(
			[
				{ name: 'logoUrl', maxCount: 1 },
				{ name: 'bannerUrl', maxCount: 1 },
			],
			{
				storage: memoryStorage(), // 📌 Ahora se almacena en memoria (buffer)
				fileFilter: (req, file, cb) => {
					if (!allowed.includes(file.mimetype)) {
						return cb(
							new BadRequestException('Formato de imagen no permitido'),
							false,
						);
					}

					cb(null, true);
				},
			}
		);
	}
}
