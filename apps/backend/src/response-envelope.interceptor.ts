// apps/backend/src/response-envelope.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse<Response>();
        const statusCode = res.statusCode;

        // Skip wrapping if already enveloped or if response is streamed (PDF etc)
        if (data?.status?.code !== undefined) return data;
        if (data instanceof Buffer) return data;

        // Derive message from status code
        const message = this.messageForStatus(statusCode, data);

        return {
          status: { code: statusCode, message },
          data: data ?? null,
        };
      }),
    );
  }

  private messageForStatus(code: number, data: any): string {
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    switch (code) {
      case 200: return 'Success';
      case 201: return 'Created successfully';
      case 204: return 'Deleted successfully';
      default: return 'Success';
    }
  }
}
