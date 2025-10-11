import { Injectable } from '@nestjs/common';
import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class UserAgentInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Guardar el User-Agent directamente en la solicitud
    const userAgent = request.headers['user-agent'];
    request.userAgent = userAgent; // Agregar userAgent a la solicitud
    return next.handle();
  }
}
