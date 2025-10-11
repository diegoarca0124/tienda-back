import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { Brand } from '@/entities/brand.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Brand]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	providers: [BrandService, RedisTokenService],
	controllers: [BrandController],
})
export class BrandModule {}
