import { RequestValidatorMiddleware } from './request-validator.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RequestValidatorMiddleware', () => {
  let middleware: RequestValidatorMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new RequestValidatorMiddleware();
    req = { headers: {}, method: 'GET', path: '/api/v1/test' } as Partial<Request>;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next for normal GET requests', () => {
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next for POST with application/json', () => {
    req.method = 'POST';
    req.headers = { 'content-type': 'application/json', 'content-length': '100' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next for POST with multipart/form-data', () => {
    req.method = 'POST';
    req.headers = { 'content-type': 'multipart/form-data; boundary=----', 'content-length': '100' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next for POST with application/x-www-form-urlencoded', () => {
    req.method = 'POST';
    req.headers = { 'content-type': 'application/x-www-form-urlencoded', 'content-length': '50' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject body exceeding 1MB with 413', () => {
    req.headers = { 'content-length': '2000000' };
    middleware.use(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        code: 'PayloadTooLarge',
        message: 'Request body exceeds maximum size of 1MB',
      }),
    }));
  });

  it('should reject unsupported content type with 415', () => {
    req.method = 'POST';
    req.headers = { 'content-type': 'text/xml', 'content-length': '100' };
    middleware.use(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        code: 'UnsupportedMediaType',
        message: expect.stringContaining('text/xml'),
      }),
    }));
  });

  it('should allow GET requests regardless of content type', () => {
    req.method = 'GET';
    req.headers = { 'content-type': 'text/xml' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow DELETE requests regardless of content type', () => {
    req.method = 'DELETE';
    req.headers = { 'content-type': 'text/xml' };
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject PUT with unsupported content type', () => {
    req.method = 'PUT';
    req.headers = { 'content-type': 'application/xml', 'content-length': '100' };
    middleware.use(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(415);
  });

  it('should reject PATCH with unsupported content type', () => {
    req.method = 'PATCH';
    req.headers = { 'content-type': 'text/plain', 'content-length': '100' };
    middleware.use(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(415);
  });

  it('should allow POST without content-type header', () => {
    req.method = 'POST';
    req.headers = {};
    middleware.use(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should use unknown as request_id when header missing', () => {
    req.headers = { 'content-length': '2000000' };
    middleware.use(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        innererror: expect.objectContaining({ request_id: 'unknown' }),
      }),
    }));
  });

  it('should use x-request-id header when present', () => {
    req.headers = { 'content-length': '2000000', 'x-request-id': 'req-abc' };
    middleware.use(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        innererror: expect.objectContaining({ request_id: 'req-abc' }),
      }),
    }));
  });

  it('should include target path in error response', () => {
    const reqWithPath = { headers: { 'content-length': '2000000' }, method: 'GET', path: '/api/v1/applications' } as Partial<Request>;
    middleware.use(reqWithPath as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ target: '/api/v1/applications' }),
    }));
  });
});
