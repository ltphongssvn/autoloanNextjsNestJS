// apps/backend/src/request-validator.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
];

@Injectable()
export class RequestValidatorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Validate body size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      res.status(413).json({
        error: {
          code: 'PayloadTooLarge',
          message: 'Request body exceeds maximum size of 1MB',
          target: req.path,
          innererror: {
            code: 'BodySizeExceeded',
            timestamp: new Date().toISOString(),
            request_id: (req.headers['x-request-id'] as string) || 'unknown',
          },
        },
      });
      return;
    }

    // Enforce content type on mutating requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-type']) {
      const contentType = req.headers['content-type'].split(';')[0].trim().toLowerCase();
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        res.status(415).json({
          error: {
            code: 'UnsupportedMediaType',
            message: `Content-Type '${contentType}' is not supported. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
            target: req.path,
            innererror: {
              code: 'InvalidContentType',
              timestamp: new Date().toISOString(),
              request_id: (req.headers['x-request-id'] as string) || 'unknown',
            },
          },
        });
        return;
      }
    }

    next();
  }
}
