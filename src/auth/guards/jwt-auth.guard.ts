import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
		if (isPublic) {
			return true;
		}
		return super.canActivate(context);
	}

	handleRequest(err: any, user: any, info: any) {
		console.log(user);

		if (err) {
			throw err;
		}

		if (info?.name === 'TokenExpiredError') {
			throw new UnauthorizedException('Tu sesión ha expirado. Inicia sesión nuevamente.');
		}

		if (info?.name === 'JsonWebTokenError') {
			throw new UnauthorizedException('La sesión es inválida o el token fue alterado.');
		}

		if (info?.name === 'NotBeforeError') {
			throw new UnauthorizedException('El token aún no es válido.');
		}

		if (err || !user) {
			throw new UnauthorizedException('No tienes autorización para acceder a este recurso.');
		}

		return user;
	}
}
