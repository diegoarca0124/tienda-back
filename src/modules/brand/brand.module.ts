import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { Brand } from '@/entities/brand.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { Product } from '@/entities/product.entity';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { BrandValidator } from './validators/brand.validator';

@Module({
	imports: [
		TypeOrmModule.forFeature([Brand, Product]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	providers: [BrandService, RedisTokenService, KibanaService, BrandValidator],
	controllers: [BrandController],
})
export class BrandModule {}
