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
import { AttributeGroup } from '@/entities/attribute-group.entity';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { AttributeValidator } from './validators/attribute.validator';

@Module({
	imports: [
		TypeOrmModule.forFeature([Attribute, AttributeValue, AttributeCategory, Category, AttributeGroup]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	controllers: [AttributeController],
	providers: [AttributeService, RedisTokenService, KibanaService, AttributeValidator],
})
export class AttributeModule {}
