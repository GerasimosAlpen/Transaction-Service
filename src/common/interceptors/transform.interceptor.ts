import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: unknown) => {
        // Handle array responses (e.g. findMany) or simple values
        if (Array.isArray(data)) {
          return {
            success: true,
            statusCode,
            message: 'Operation successful',
            data,
          };
        }

        // Handle object responses (flatten them into the root response)
        if (data && typeof data === 'object') {
          const resObj = { ...(data as Record<string, unknown>) };
          const message =
            typeof resObj.message === 'string' ? resObj.message : undefined;
          delete resObj.message;
          delete resObj.success;

          return {
            success: true,
            statusCode,
            message: message || 'Operation successful',
            ...resObj,
          };
        }

        // Handle case where controller returns a primitive or nothing
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
