import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Ha ocurrido un error interno en el servidor.';

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const res: any = exception.getResponse();
			message = res.message || res || exception.message;
		}

		// Errores de base de datos / red (no HttpException)
		else if (exception.code === 'ECONNREFUSED') {
			message = 'Conexión rechazada a la base de datos.';
		} else if (exception.code === 'ETIMEDOUT') {
			message = 'La conexión a la base de datos expiró.';
		} else if (exception.code === 'ENOTFOUND') {
			message = 'Host de la base de datos no encontrado.';
		} else if (exception.code === 'ECONNABORTED') {
			message = 'Conexión abortada con la base de datos.';
		}

		response.status(status).json({
			statusCode: status,
			error: exception.name || 'InternalServerError',
			message,
			timestamp: new Date().toISOString(),
			path: ctx.getRequest().url,
		});
	}
}
