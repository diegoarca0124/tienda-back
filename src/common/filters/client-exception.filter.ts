import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch(BadRequestException)
export class ClientExceptionFilter implements ExceptionFilter {
	catch(exception: BadRequestException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const requestId = uuidv4();

		const res: any = exception.getResponse();
		console.log(400);

		console.log('res', res);

		// Tomamos `messages` directamente si existen
		const message = res.messages || res.message || exception.message;

		response.status(400).json({
			statusCode: 400,
			error: 'BadRequest',
			internalCode: 'VALIDATION_ERROR',
			message, // <- aquí aparecen todos los errores de DTO y personalizados
			path: request.url,
			method: request.method,
			requestId,
			timestamp: new Date().toISOString(),
		});

		console.error(`[${requestId}] [${request.method} ${request.url}] 400 - ${JSON.stringify(message)}`);
	}
}
