import { Injectable } from '@nestjs/common';
import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const requestId = randomUUID().split('-').slice(0, 4).join('-');
		request.requestId = requestId;
		response.setHeader('x-request-id', requestId);
		console.log('requestId', requestId);
		return next.handle();
	}
}
