// common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { logHelper } from '../utils/logger-helper.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message: string | object = 'Ha ocurrido un error interno, intente más tarde';
		let code = 'INTERNAL_ERROR';
		let validationMessages: any = null; // 👈 para almacenar los errores del DTO

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const res = exception.getResponse();

			if (typeof res === 'object' && res !== null) {
				const safeResponse: any = res as any;
				console.log('safeResponse', safeResponse);

				if (safeResponse.error === 'ValidationError' && safeResponse.messages) {
					validationMessages = safeResponse.messages;
					message = 'Errores de validación en la solicitud';
					code = 'VALIDATION_ERROR';
				} else {
					message = safeResponse.message || message;
					code = safeResponse.code || HttpStatus[status];
				}
			} else {
				message = typeof res === 'string' ? res : message;
				code = HttpStatus[status];
			}
		}

		// ✅ Respuesta al cliente
		response.status(status).json({
			success: false,
			statusCode: status,
			error: exception.name || 'Error',
			code,
			message, // texto genérico
			validation: validationMessages, // 👈 aquí van los detalles del DTO
			timestamp: new Date().toISOString(),
		});
	}
}
