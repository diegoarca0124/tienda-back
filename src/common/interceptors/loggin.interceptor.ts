import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { KibanaService } from '../services/kibana/kibana.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	constructor(private readonly kibanaService: KibanaService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const start = Date.now();
		return next.handle().pipe(
			tap(() => {
				const response = context.switchToHttp().getResponse();
				const duration = Date.now() - start;
				const data = {
					requestId: request.requestId,
					method: request.method,
					url: request.url,
					statusCode: response.statusCode,
					duration,
					ip: request.ip,
					userId: request.user?.sub || null,
				};
				this.kibanaService.http({ ...data });
			})
		);
	}
}
