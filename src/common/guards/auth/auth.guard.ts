import { RedisTokenService } from '@/common/services/redis-token/redis-token.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly jwtService: JwtService,
		private readonly redisTokenService: RedisTokenService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
		console.log(requiredPermissions);

		/* if (!requiredPermissions) {
			return true; // Si no hay permisos requeridos, la ruta está abierta
		} */

		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new ForbiddenException('No se proporcionó un token de autenticación.');
		}

		if (process.env.TOKEN_REVOCATION === 'true') {
			const isRevoked = await this.redisTokenService.get(`revoked:${token}`);
			if (isRevoked) {
				throw new UnauthorizedException('El token fue revocado.');
			}
		}

		try {
			const payload = this.jwtService.verify(token);
			console.log(payload);

			/* 
    if (payload.email !== 'diegoarca02@gmail.com') {
      const userPermissions = await this.collaboratorService.get_permission_value_collaborator(payload.id);

      // Verifica si el usuario tiene todos los permisos requeridos
      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'Acceso denegado: no tienes los permisos necesarios para realizar esta acción.',
        );
      }
    }
    */

			return true;
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new ForbiddenException('El token ha expirado. Inicia sesión nuevamente.');
			}

			if (error.name === 'JsonWebTokenError') {
				throw new ForbiddenException('Token inválido. Verifica tus credenciales.');
			}

			throw new ForbiddenException('Error de autenticación. Acceso denegado.');
		}
	}

	private extractTokenFromHeader(request: any): string | null {
		const authHeader = request.headers['authorization'];

		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.split(' ')[1];
		}
		return null;
	}
}
