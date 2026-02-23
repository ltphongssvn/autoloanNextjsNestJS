// apps/backend/src/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const STATUS_CODE_MAP: Record<number, { code: string; innerCode: string }> = {
  400: { code: 'BadRequest', innerCode: 'ParameterMissing' },
  401: { code: 'Unauthorized', innerCode: 'AuthenticationRequired' },
  403: { code: 'Forbidden', innerCode: 'InsufficientPermissions' },
  404: { code: 'NotFound', innerCode: 'ResourceNotFound' },
  409: { code: 'Conflict', innerCode: 'ResourceConflict' },
  422: { code: 'ValidationError', innerCode: 'InvalidInput' },
  429: { code: 'TooManyRequests', innerCode: 'RateLimitExceeded' },
  500: { code: 'InternalServerError', innerCode: 'UnexpectedError' },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);
    const details = this.extractDetails(exception);
    const mapping = STATUS_CODE_MAP[status] || { code: 'Error', innerCode: 'UnknownError' };

    const errorResponse: any = {
      error: {
        code: mapping.code,
        message,
        target: request?.path || '/',
        innererror: {
          code: mapping.innerCode,
          timestamp: new Date().toISOString(),
          request_id: randomUUID(),
        },
      },
    };

    if (details) {
      errorResponse.error.innererror.details = details;
    }

    if (response.headersSent) return;
    response.status(status).json(errorResponse);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') return resp;
      if (typeof resp === 'object' && resp !== null) {
        const obj = resp as any;
        if (typeof obj.message === 'string') return obj.message;
        if (Array.isArray(obj.message)) return obj.message.join('. ');
      }
      return exception.message;
    }
    return 'Internal server error';
  }

  private extractDetails(exception: unknown): any[] | null {
    if (exception instanceof HttpException) {
      const resp = exception.getResponse() as any;
      if (Array.isArray(resp?.message) && resp.message.length > 1) {
        return resp.message.map((m: string) => ({ message: m }));
      }
    }
    return null;
  }
}
