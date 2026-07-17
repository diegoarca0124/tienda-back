// common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { logHelper } from '../utils/logger-helper.util';
import { KibanaService } from '../services/kibana/kibana.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(private kibanaService: KibanaService) {}

	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message: string | object = 'Ha ocurrido un error interno, intente más tarde';
		let code = 'INTERNAL_ERROR';
		let validationMessages: any = null;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const res = exception.getResponse();

			if (typeof res === 'object' && res !== null) {
				const safeResponse: any = res as any;

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

		this.kibanaService.error({
			requestId: request.requestId,
			method: request.method,
			url: request.url,
			statusCode: status,
			ip: request.ip,
			userId: request.user?.sub || null,
			code,
			message,
			error: exception.name,
			stack: exception.stack,
		});

		response.status(status).json({
			success: false,
			requestId: request.requestId,
			statusCode: status,
			error: exception.name || 'Error',
			code,
			message,
			validation: validationMessages,
			timestamp: new Date().toISOString(),
		});
	}
}
