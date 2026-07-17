import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@/entities/category.entity';
import { JwtModule } from '@nestjs/jwt';
import { Subcategory } from '@/entities/subcategory.entity';
import Redis from 'ioredis';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { Product } from '@/entities/product.entity';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { CategoryValidator } from './validators/category.validator';

@Module({
	imports: [
		TypeOrmModule.forFeature([Category, Subcategory, Product]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	providers: [CategoryService, RedisTokenService, KibanaService, CategoryValidator],
	controllers: [CategoryController],
})
export class CategoryModule {}
