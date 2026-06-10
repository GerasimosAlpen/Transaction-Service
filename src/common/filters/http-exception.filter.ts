import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: unknown;
    let error: string | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, unknown>;
      message = resObj.message || exceptionResponse;
      error = typeof resObj.error === 'string' ? resObj.error : undefined;
    } else {
      message = exceptionResponse;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      error: error,
    });
  }
}
