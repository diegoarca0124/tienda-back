import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly redisTokenService: RedisTokenService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET,
		});
	}

	async validate(payload: any) {
		try {
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
			return payload;
		}
	}
}
