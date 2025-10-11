import { Module } from '@nestjs/common';
import { CollaboratorController } from './collaborator.controller';
import { CollaboratorService } from './collaborator.service';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Collaborator } from '@/entities/collaborator.entity';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { AuthService } from './auth.service';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Collaborator]),
		JwtModule.register({
			secret: 'praxis',
			signOptions: { expiresIn: '1d' },
		}),
	],
	controllers: [CollaboratorController],
	providers: [CollaboratorService, AuthService, RedisTokenService],
})
export class CollaboratorModule {}
