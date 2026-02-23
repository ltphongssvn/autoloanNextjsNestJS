// apps/backend/src/response-time.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const originalWriteHead = res.writeHead;
    (res as any).writeHead = function (...args: any[]) {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      return (originalWriteHead as any).apply(this, args);
    };
    next();
  }
}
