import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from '@/entities/collaborator.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly redisTokenService: RedisTokenService,
		@InjectRepository(Collaborator) private readonly collaboratorRepository: Repository<Collaborator>
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET,
		});
	}

	async validate(payload: any) {
		try {
			if (typeof payload.id !== 'string' || !payload.id) {
				throw new UnauthorizedException('La sesión no es válida. Inicia sesión nuevamente.');
			}
			const isActive = await this.collaboratorRepository.exists({ where: { id: payload.id, status: true } });
			if (!isActive) {
				throw new UnauthorizedException('Tu cuenta no está disponible. Inicia sesión nuevamente.');
			}
			if (process.env.TOKEN_REVOCATION === 'true') {
				const isRevoked = await this.redisTokenService.get(`revoked:${payload.jti}`);
				if (isRevoked) {
					throw new UnauthorizedException('Tu sesión ha sido cerrada o revocada. Inicia sesión nuevamente.');
				}
			}
			return payload;
		} catch (err: any) {
			if (err instanceof UnauthorizedException) {
				throw err;
			}
			throw new ServiceUnavailableException('No fue posible validar tu sesión. Intenta nuevamente.');
		}
	}
}
