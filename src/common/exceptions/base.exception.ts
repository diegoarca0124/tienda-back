import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
	constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR, code?: string, details?: any) {
		super(
			{
				success: false,
				statusCode: status,
				message,
				code: code ?? HttpStatus[status],
				details,
				timestamp: new Date().toISOString(),
			},
			status
		);
	}
}
