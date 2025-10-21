import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { PrometheusService } from '../services/grafana/prometheus.service';
import { Observable } from 'rxjs';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const method = request.method;
		const route = request.route?.path || request.url;

		const start = Date.now();

		return next.handle().pipe(
			tap(() => {
				const duration = (Date.now() - start) / 1000;
				PrometheusService.updateSystemMetrics();
			})
		);
	}
}
