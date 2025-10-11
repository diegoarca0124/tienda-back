import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@/entities/category.entity';
import { JwtModule } from '@nestjs/jwt';
import { Subcategory } from '@/entities/subcategory.entity';
import Redis from 'ioredis';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Category, Subcategory]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	providers: [CategoryService, RedisTokenService],
	controllers: [CategoryController],
})
export class CategoryModule {}
