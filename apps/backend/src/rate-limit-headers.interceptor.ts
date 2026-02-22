// apps/backend/src/rate-limit-headers.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';

const RATE_LIMIT_MAX = 60; // matches ThrottlerModule config

@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  private readonly counters = new Map<string, { count: number; windowStart: number }>();

  private getWindowStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
  }

  private getWindowReset(): number {
    const now = new Date();
    return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1).getTime() / 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const windowStart = this.getWindowStart();

    let entry = this.counters.get(ip);
    if (!entry || entry.windowStart !== windowStart) {
      entry = { count: 0, windowStart };
      this.counters.set(ip, entry);
    }
    entry.count++;

    const remaining = Math.max(RATE_LIMIT_MAX - entry.count, 0);
    const reset = this.getWindowReset();

    return next.handle().pipe(
      tap(() => {
        res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', reset.toString());
      }),
    );
  }
}
