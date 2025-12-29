import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export abstract class BaseValidationInterceptor<T> implements NestInterceptor {
	protected abstract getDtoClass(): new () => T;
	protected abstract validateBody(body: any): Promise<{ field: string; message: string }[]>;
	protected abstract validateFiles(files: any): Promise<{ field: string; message: string }[]>;

	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const request = context.switchToHttp().getRequest();
		const body = request.body;
		const files = request.files;

		/**
		 * ✅ PRE-PROCESAMIENTO:
		 * Intenta convertir a objeto cualquier campo que tenga formato JSON
		 * Esto solo afecta a los campos que son string.
		 */
		/* console.log('body before parse =>', body);
		console.log('files before parse =>', files); */
		for (const key of Object.keys(body)) {
			const value = body[key];
			if (typeof value === 'string') {
				// Si parece JSON (empieza con { o [), intentamos parsear
				const firstChar = value.trim().charAt(0);
				if (firstChar === '{' || firstChar === '[') {
					try {
						body[key] = JSON.parse(value);
					} catch {
						// Si falla, lo dejamos como string para que la validación lo capture
					}
				}
			}
		}

		const dto: any = plainToInstance(this.getDtoClass(), body);
		const errors = await validate(dto);

		let groupedErrors: { [key: string]: string[] } = {};

		// ✅ Errores de class-validator
		if (errors.length > 0) {
			errors.forEach((err) => {
				const field = err.property;
				if (!groupedErrors[field]) groupedErrors[field] = [];
				Object.values(err.constraints || {}).forEach((msg) => groupedErrors[field].push(msg));
			});
		}

		// ✅ Errores personalizados del body
		const customErrors = await this.validateBody(body);
		customErrors.forEach((err) => {
			if (!groupedErrors[err.field]) groupedErrors[err.field] = [];
			groupedErrors[err.field].push(err.message);
		});

		// ✅ Errores de archivos
		if (files) {
			const fileErrors = await this.validateFiles(files);
			fileErrors.forEach((err) => {
				if (!groupedErrors[err.field]) groupedErrors[err.field] = [];
				groupedErrors[err.field].push(err.message);
			});
		}

		if (Object.keys(groupedErrors).length > 0) {
			throw new BadRequestException({
				statusCode: 400,
				error: 'ValidationError',
				messages: groupedErrors,
			});
		}

		return next.handle();
	}
}
