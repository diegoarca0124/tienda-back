import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppDataSource } from './data-source';
import { CollaboratorModule } from './modules/collaborator/collaborator.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { AttributeModule } from './modules/attribute/attribute.module';
import { RedisTokenService } from './common/services/redis-token/redis-token.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ProductModule } from './modules/product/product.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AuthModule } from './auth/auth.module';
import { KibanaService } from './common/services/kibana/kibana.service';
import { LoggingInterceptor } from './common/interceptors/loggin.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Module({
	imports: [
		TypeOrmModule.forRoot(AppDataSource.options),
		CollaboratorModule,
		CategoryModule,
		BrandModule,
		AttributeModule,
		PrometheusModule.register({
			defaultMetrics: { enabled: false },
			path: '/metrics',
		}),
		ProductModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		RedisTokenService,
		KibanaService,
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},

		{
			provide: APP_GUARD,
			useClass: PermissionsGuard,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestIdInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: AllExceptionsFilter,
		},
	],
})
export class AppModule {}
