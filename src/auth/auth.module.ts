import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaborator } from '@/entities/collaborator.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Collaborator]),
		PassportModule.register({
			defaultStrategy: 'jwt',
		}),
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: {
				expiresIn: '1d',
			},
		}),
	],
	providers: [JwtStrategy, RedisTokenService],
	exports: [JwtModule],
})
export class AuthModule {}
