// apps/backend/src/response-time.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      res.setHeader('X-Response-Time', `${(Number(process.hrtime.bigint() - start) / 1e6).toFixed(2)}ms`);
    });
    next();
  }
}
