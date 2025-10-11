// common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req = context.switchToHttp().getRequest();
		const { method, url } = req;

		const now = Date.now();
		return next.handle().pipe(
			tap(() => this.logger.log(`${method} ${url} - ${Date.now() - now}ms`)),
			catchError((err) => {
				this.logger.error(`${method} ${url} - FAILED after ${Date.now() - now}ms`, err.stack);
				return throwError(() => err);
			})
		);
	}
}
