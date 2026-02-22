import { ApiVersioningMiddleware } from './api-versioning.middleware';
import { Request, Response, NextFunction } from 'express';

describe('ApiVersioningMiddleware', () => {
  let middleware: ApiVersioningMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new ApiVersioningMiddleware();
    req = { headers: {}, path: '/api/v1/test' };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should set api-version and api-supported-versions headers', () => {
    middleware.use(req as Request, res as Response, next);
    expect(res.setHeader).toHaveBeenCalledWith('api-version', '1.0.2');
    expect(res.setHeader).toHaveBeenCalledWith('api-supported-versions', '1.0, 1.0.1, 1.0.2');
    expect(next).toHaveBeenCalled();
  });

  it('should call next when no api-version header requested', () => {
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next when supported version is requested', () => {
    req.headers = { 'api-version': '1.0' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next for version 1.0.1', () => {
    req.headers = { 'api-version': '1.0.1' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next for version 1.0.2', () => {
    req.headers = { 'api-version': '1.0.2' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject unsupported api-version with 400 and Microsoft error format', () => {
    req.headers = { 'api-version': '2.0', 'x-request-id': 'req-123' };
    middleware.use(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UnsupportedApiVersion',
        message: "API version '2.0' is not supported. Supported versions: 1.0, 1.0.1, 1.0.2",
        target: '/api/v1/test',
        innererror: {
          code: 'InvalidVersion',
          timestamp: expect.any(String),
          request_id: 'req-123',
        },
      },
    });
  });

  it('should use unknown as request_id when x-request-id header is missing', () => {
    req.headers = { 'api-version': '3.0' };
    middleware.use(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          innererror: expect.objectContaining({ request_id: 'unknown' }),
        }),
      }),
    );
  });
});
