import { Module } from '@nestjs/common';
import { AttributeController } from './attribute.controller';
import { AttributeService } from './attribute.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from '@/entities/attribute.entity';
import { AttributeValue } from '@/entities/attribute-value.entity';
import { AttributeCategory } from '@/entities/attribute-category.entity';
import { JwtModule } from '@nestjs/jwt';
import { Category } from '@/entities/category.entity';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Attribute, AttributeValue, AttributeCategory, Category]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	controllers: [AttributeController],
	providers: [AttributeService, RedisTokenService],
})
export class AttributeModule {}
