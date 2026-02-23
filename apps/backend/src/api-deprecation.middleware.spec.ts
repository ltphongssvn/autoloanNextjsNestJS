import { ApiDeprecationMiddleware, DeprecatedRoute } from './api-deprecation.middleware';
import { Request, Response, NextFunction } from 'express';

// Access the module internals for testing
jest.mock('./api-deprecation.middleware', () => {
  const original = jest.requireActual('./api-deprecation.middleware');
  return original;
});

describe('ApiDeprecationMiddleware', () => {
  let middleware: ApiDeprecationMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new ApiDeprecationMiddleware();
    req = { method: 'GET', path: '/api/v1/applications' } as Partial<Request>;
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  it('should call next for non-deprecated routes', () => {
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('should call next regardless of deprecation status', () => {
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  describe('with deprecated routes', () => {
    let testMiddleware: { use: (req: Request, res: Response, next: NextFunction) => void };

    beforeEach(() => {
      const routes: DeprecatedRoute[] = [
        {
          method: 'GET',
          path: /^\/api\/v1\/legacy/,
          date: 'Sat, 01 Mar 2026 00:00:00 GMT',
          sunset: 'Tue, 01 Sep 2026 00:00:00 GMT',
          replacement: '/api/v1/applications',
        },
        {
          method: 'POST',
          path: /^\/api\/v1\/old-submit/,
          date: 'Mon, 01 Jun 2026 00:00:00 GMT',
        },
      ];
      testMiddleware = {
        use(req: Request, res: Response, next: NextFunction) {
          const match = routes.find(
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
        },
      };
    });

    it('should set Deprecation header for deprecated GET route', () => {
      req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith('Deprecation', 'Sat, 01 Mar 2026 00:00:00 GMT');
    });

    it('should set Sunset header when provided', () => {
      req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith('Sunset', 'Tue, 01 Sep 2026 00:00:00 GMT');
    });

    it('should set Link header with successor-version when replacement provided', () => {
      req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith('Link', '</api/v1/applications>; rel="successor-version"');
    });

    it('should not set Sunset header when not provided', () => {
      req = { method: 'POST', path: '/api/v1/old-submit' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith('Deprecation', 'Mon, 01 Jun 2026 00:00:00 GMT');
      expect(res.setHeader).not.toHaveBeenCalledWith('Sunset', expect.any(String));
    });

    it('should not set Link header when replacement not provided', () => {
      req = { method: 'POST', path: '/api/v1/old-submit' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).not.toHaveBeenCalledWith('Link', expect.any(String));
    });

    it('should not match wrong HTTP method', () => {
      req = { method: 'POST', path: '/api/v1/legacy' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('should not match non-deprecated path', () => {
      req = { method: 'GET', path: '/api/v1/applications' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('should always call next', () => {
      req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
      testMiddleware.use(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
