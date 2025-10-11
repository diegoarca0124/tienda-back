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
dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Module({
	imports: [
		TypeOrmModule.forRoot(AppDataSource.options),
		CollaboratorModule,
		CategoryModule,
		BrandModule,
		AttributeModule,
	],
	controllers: [AppController],
	providers: [AppService, RedisTokenService],
})
export class AppModule {}
