import { ResponseTimeMiddleware } from './response-time.middleware';
import { Request, Response, NextFunction } from 'express';

describe('ResponseTimeMiddleware', () => {
  let middleware: ResponseTimeMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let writeHeadCalled: boolean;

  beforeEach(() => {
    middleware = new ResponseTimeMiddleware();
    req = {};
    writeHeadCalled = false;
    res = {
      setHeader: jest.fn(),
      writeHead: jest.fn().mockImplementation(function (this: Response) {
        writeHeadCalled = true;
        return this;
      }) as unknown as Response['writeHead'],
    };
    next = jest.fn();
  });

  it('should call next immediately', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should set X-Response-Time header when writeHead is called', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    (res as Response).writeHead(200);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Response-Time',
      expect.stringMatching(/^\d+\.\d{2}ms$/),
    );
  });

  it('should measure elapsed time in milliseconds', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    (res as Response).writeHead(200);
    const call = (res.setHeader as jest.Mock).mock.calls.find((c: string[]) => c[0] === 'X-Response-Time');
    const ms = parseFloat(call[1]);
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(ms).toBeLessThan(1000);
  });

  it('should not set header before writeHead is called', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('should call original writeHead', () => {
    middleware.use(req as Request, res as unknown as Response, next);
    (res as Response).writeHead(200);
    expect(writeHeadCalled).toBe(true);
  });
});
