import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/filters/custom-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppException } from './common/exceptions/base.exception';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppDataSource } from './data-source';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	try {
		await AppDataSource.initialize();
		logger.log('📦 Base de datos conectada correctamente');
	} catch (error) {
		logger.error('❌ Error al conectar con la base de datos', error);
		process.exit(1);
	}

	const app = await NestFactory.create(AppModule);
	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalInterceptors(new LoggingInterceptor());
	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
	app.setGlobalPrefix('api');
	app.enableCors();

	await app.listen(process.env.PORT ?? 4000);
	logger.log(`🚀 Servidor iniciado en http://localhost:${process.env.PORT ?? 3000}`);
}

bootstrap();
