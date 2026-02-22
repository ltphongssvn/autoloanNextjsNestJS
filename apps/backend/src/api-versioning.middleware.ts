// apps/backend/src/api-versioning.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const API_VERSION = '1.0.2';
const SUPPORTED_VERSIONS = ['1.0', '1.0.1', '1.0.2'];

@Injectable()
export class ApiVersioningMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set version headers on every response
    res.setHeader('api-version', API_VERSION);
    res.setHeader('api-supported-versions', SUPPORTED_VERSIONS.join(', '));

    // Check client-requested api-version header
    const requestedVersion = req.headers['api-version'] as string | undefined;
    if (requestedVersion && !SUPPORTED_VERSIONS.includes(requestedVersion)) {
      res.status(400).json({
        error: {
          code: 'UnsupportedApiVersion',
          message: `API version '${requestedVersion}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
          target: req.path,
          innererror: {
            code: 'InvalidVersion',
            timestamp: new Date().toISOString(),
            request_id: req.headers['x-request-id'] || 'unknown',
          },
        },
      });
      return;
    }

    next();
  }
}
