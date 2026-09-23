import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { Collaborator } from '@/entities/collaborator.entity';
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(Collaborator) private collaboratorRepository: Repository<Collaborator>,
		private redisTokenService: RedisTokenService,
		private jwtService: JwtService
	) {}

	async generateToken(user: { names: string; surname: string; email: string; role: string; id: string }) {
		try {
			const payload = {
				names: user.names,
				surname: user.surname,
				email: user.email,
				role: user.role,
				id: user.id,
				jti: crypto.randomUUID(),
			};
			const token = this.jwtService.sign(payload);
			const decoded = this.jwtService.decode(token) as { exp?: number } | null;
			const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 86400;

			await this.redisTokenService.addToSet(
				`active-tokens:${user.id}`,
				JSON.stringify({ jti: payload.jti, exp: decoded?.exp }),
				expiresIn
			);

			return token;
		} catch (error) {
			throw new InternalServerErrorException('Error generando el token.');
		}
	}

	async revokeToken(jti: string, exp?: number) {
		const expiresIn = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 1) : 86400;
		await this.redisTokenService.set(`revoked:${jti}`, 'true', expiresIn);
	}

	async revokeUserTokens(userId: string) {
		const key = `active-tokens:${userId}`;
		const activeTokens = await this.redisTokenService.getSetMembers(key);

		for (const activeToken of activeTokens) {
			const { jti, exp } = JSON.parse(activeToken) as { jti?: string; exp?: number };
			if (jti) await this.revokeToken(jti, exp);
		}

		await this.redisTokenService.del(key);
		return activeTokens.length;
	}
}
