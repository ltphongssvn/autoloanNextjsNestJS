import { ResponseTimeMiddleware } from './response-time.middleware';
import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';

describe('ResponseTimeMiddleware', () => {
  let middleware: ResponseTimeMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response> & EventEmitter;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new ResponseTimeMiddleware();
    req = {};
    res = Object.assign(new EventEmitter(), {
      setHeader: jest.fn(),
    }) as unknown as Partial<Response> & EventEmitter;
    next = jest.fn();
  });

  it('should call next immediately', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should set X-Response-Time header on finish', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    res.emit('finish');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Response-Time',
      expect.stringMatching(/^\d+\.\d{2}ms$/),
    );
  });

  it('should measure elapsed time in milliseconds', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    res.emit('finish');
    const call = (res.setHeader as jest.Mock).mock.calls[0];
    const ms = parseFloat(call[1]);
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(ms).toBeLessThan(1000);
  });

  it('should not set header before finish event', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalled();
  });
});
