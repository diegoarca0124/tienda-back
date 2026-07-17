import { Module } from '@nestjs/common';
import { CollaboratorController } from './collaborator.controller';
import { CollaboratorService } from './collaborator.service';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Collaborator } from '@/entities/collaborator.entity';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { AuthService } from '../../auth/auth.service';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { KibanaService } from '@/common/services/kibana/kibana.service';
import { CollaboratorValidator } from './validators/collaborator.validator';

@Module({
	imports: [
		TypeOrmModule.forFeature([Collaborator]),
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: '1d' },
		}),
	],
	controllers: [CollaboratorController],
	providers: [CollaboratorService, AuthService, RedisTokenService, KibanaService, CollaboratorValidator],
})
export class CollaboratorModule {}
