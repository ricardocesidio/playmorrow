import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Send 5xx errors to Sentry
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    const message: string | Record<string, unknown> = exception instanceof HttpException
      ? (exception.getResponse() as string | Record<string, unknown>)
      : 'Internal server error';

    const body = {
      statusCode: status,
      message: typeof message === 'string' ? message : message.message || message,
      error: typeof message === 'string' ? message : message.error || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      (body as { stack?: string }).stack = exception.stack;
    }

    response.status(status).json(body);
  }
}
