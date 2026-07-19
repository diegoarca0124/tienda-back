import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppException } from './common/exceptions/base.exception';
import { AppDataSource } from './data-source';
import * as dotenv from 'dotenv';
dotenv.config();
// 🔥 Borra TODAS las métricas previas del registro global

async function bootstrap() {
	try {
		await AppDataSource.initialize();
	} catch (error) {
		process.exit(1);
	}

	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		})
	);
	app.setGlobalPrefix('api');
	app.enableCors();

	await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
