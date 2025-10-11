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
			};
			return this.jwtService.sign(payload);
		} catch (error) {
			throw new InternalServerErrorException('Error generando el token.');
		}
	}

	async validateToken(token: string): Promise<any> {
		try {
			const payload = this.jwtService.verify(token, {
				secret: process.env.JWT_SECRET,
			});

			if (process.env.TOKEN_REVOCATION === 'true') {
				const isRevoked = await this.redisTokenService.get(`revoked:${token}`);
				if (isRevoked) {
					throw new UnauthorizedException('El token fue revocado');
				}
			}

			return payload;
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new UnauthorizedException('El token ha expirado');
			}

			if (error.name === 'JsonWebTokenError') {
				throw new UnauthorizedException('El token es inválido');
			}

			throw new UnauthorizedException('Error al validar el token');
		}
	}

	async revokeToken(token: string) {
		const decoded: any = this.jwtService.decode(token);
		const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;

		await this.redisTokenService.set(`revoked:${token}`, 'true', expiresIn);
	}
}
