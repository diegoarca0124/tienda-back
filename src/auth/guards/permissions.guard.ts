import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

		if (!requiredPermissions) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		// PERMISOS USUARIO
		const userPermissions = user.permissions || [];

		const hasPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission));

		if (!hasPermissions) {
			throw new ForbiddenException('No tienes permisos para realizar esta acción.');
		}

		return true;
	}
}
