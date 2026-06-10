import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return {
            success: true,
            statusCode,
            message: 'Operation successful',
            data,
          };
        }

        if (data && typeof data === 'object') {
          const { message, ...rest } = data;
          delete rest.success;
          return {
            success: true,
            statusCode,
            message: message || 'Operation successful',
            ...rest,
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Operation successful',
          data,
        };
      }),
    );
  }
}
