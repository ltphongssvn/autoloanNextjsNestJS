// apps/backend/src/api-deprecation.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface DeprecatedRoute {
  method: string;
  path: RegExp;
  date: string;
  sunset?: string;
  replacement?: string;
}

const DEPRECATED_ROUTES: DeprecatedRoute[] = [
  // Example: uncomment and add deprecated routes as needed
  // {
  //   method: 'GET',
  //   path: /^\/api\/v1\/applications\/legacy/,
  //   date: 'Sat, 01 Mar 2026 00:00:00 GMT',
  //   sunset: 'Tue, 01 Sep 2026 00:00:00 GMT',
  //   replacement: '/api/v1/applications',
  // },
];

@Injectable()
export class ApiDeprecationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const match = DEPRECATED_ROUTES.find(
      (route) => route.method === req.method && route.path.test(req.path),
    );
    if (match) {
      res.setHeader('Deprecation', match.date);
      if (match.sunset) {
        res.setHeader('Sunset', match.sunset);
      }
      if (match.replacement) {
        res.setHeader('Link', `<${match.replacement}>; rel="successor-version"`);
      }
    }
    next();
  }
}
