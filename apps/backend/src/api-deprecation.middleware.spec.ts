import { ApiDeprecationMiddleware, DEPRECATED_ROUTES, DeprecatedRoute } from './api-deprecation.middleware';
import { Request, Response, NextFunction } from 'express';

describe('ApiDeprecationMiddleware', () => {
  let middleware: ApiDeprecationMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let savedRoutes: DeprecatedRoute[];

  beforeEach(() => {
    middleware = new ApiDeprecationMiddleware();
    req = { method: 'GET', path: '/api/v1/applications' } as Partial<Request>;
    res = { setHeader: jest.fn() };
    next = jest.fn();
    savedRoutes = [...DEPRECATED_ROUTES];
    DEPRECATED_ROUTES.length = 0;
  });

  afterEach(() => {
    DEPRECATED_ROUTES.length = 0;
    DEPRECATED_ROUTES.push(...savedRoutes);
  });

  it('should call next for non-deprecated routes', () => {
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('should set Deprecation header for matching route', () => {
    DEPRECATED_ROUTES.push({
      method: 'GET',
      path: /^\/api\/v1\/legacy/,
      date: 'Sat, 01 Mar 2026 00:00:00 GMT',
      sunset: 'Tue, 01 Sep 2026 00:00:00 GMT',
      replacement: '/api/v1/applications',
    });
    req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Deprecation', 'Sat, 01 Mar 2026 00:00:00 GMT');
    expect(next).toHaveBeenCalled();
  });

  it('should set Sunset header when provided', () => {
    DEPRECATED_ROUTES.push({
      method: 'GET',
      path: /^\/api\/v1\/legacy/,
      date: 'Sat, 01 Mar 2026 00:00:00 GMT',
      sunset: 'Tue, 01 Sep 2026 00:00:00 GMT',
    });
    req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Sunset', 'Tue, 01 Sep 2026 00:00:00 GMT');
  });

  it('should set Link header with successor-version when replacement provided', () => {
    DEPRECATED_ROUTES.push({
      method: 'GET',
      path: /^\/api\/v1\/legacy/,
      date: 'Sat, 01 Mar 2026 00:00:00 GMT',
      replacement: '/api/v1/applications',
    });
    req = { method: 'GET', path: '/api/v1/legacy' } as Partial<Request>;
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Link', '</api/v1/applications>; rel="successor-version"');
  });

  it('should not set Sunset when not provided', () => {
    DEPRECATED_ROUTES.push({
      method: 'POST',
      path: /^\/api\/v1\/old-submit/,
      date: 'Mon, 01 Jun 2026 00:00:00 GMT',
    });
    req = { method: 'POST', path: '/api/v1/old-submit' } as Partial<Request>;
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('Deprecation', 'Mon, 01 Jun 2026 00:00:00 GMT');
    expect(res.setHeader).not.toHaveBeenCalledWith('Sunset', expect.any(String));
    expect(res.setHeader).not.toHaveBeenCalledWith('Link', expect.any(String));
  });

  it('should not match wrong HTTP method', () => {
    DEPRECATED_ROUTES.push({
      method: 'GET',
      path: /^\/api\/v1\/legacy/,
      date: 'Sat, 01 Mar 2026 00:00:00 GMT',
    });
    req = { method: 'POST', path: '/api/v1/legacy' } as Partial<Request>;
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should not match non-deprecated path', () => {
    DEPRECATED_ROUTES.push({
      method: 'GET',
      path: /^\/api\/v1\/legacy/,
      date: 'Sat, 01 Mar 2026 00:00:00 GMT',
    });
    req = { method: 'GET', path: '/api/v1/applications' } as Partial<Request>;
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).not.toHaveBeenCalled();
  });
});
