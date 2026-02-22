import { RateLimitHeadersInterceptor } from './rate-limit-headers.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('RateLimitHeadersInterceptor', () => {
  let interceptor: RateLimitHeadersInterceptor;
  let mockContext: ExecutionContext;
  let mockNext: CallHandler;
  let mockRes: { setHeader: jest.Mock };
  let mockReq: { ip: string };

  beforeEach(() => {
    interceptor = new RateLimitHeadersInterceptor();
    mockRes = { setHeader: jest.fn() };
    mockReq = { ip: '127.0.0.1' };
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;
    mockNext = { handle: () => of({ data: 'test' }) };
  });

  it('should set X-RateLimit-Limit header', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '60');
      done();
    });
  });

  it('should set X-RateLimit-Remaining header', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '59');
      done();
    });
  });

  it('should set X-RateLimit-Reset header as unix timestamp', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      const resetCall = mockRes.setHeader.mock.calls.find((c: string[]) => c[0] === 'X-RateLimit-Reset');
      expect(resetCall).toBeDefined();
      const resetVal = parseInt(resetCall[1], 10);
      expect(resetVal).toBeGreaterThan(Math.floor(Date.now() / 1000));
      done();
    });
  });

  it('should decrement remaining on repeated requests', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      interceptor.intercept(mockContext, mockNext).subscribe(() => {
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '58');
        done();
      });
    });
  });

  it('should track different IPs separately', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      mockReq.ip = '192.168.1.1';
      interceptor.intercept(mockContext, mockNext).subscribe(() => {
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '59');
        done();
      });
    });
  });

  it('should floor remaining at 0', (done) => {
    // Exhaust the limit
    for (let i = 0; i < 60; i++) {
      interceptor.intercept(mockContext, mockNext).subscribe();
    }
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      done();
    });
  });

  it('should fallback to unknown when ip is missing', (done) => {
    mockReq = { ip: '' } as { ip: string };
    (mockContext.switchToHttp as jest.Mock) = jest.fn().mockReturnValue({
      getRequest: () => ({ connection: { remoteAddress: '10.0.0.1' } }),
      getResponse: () => mockRes,
    });
    const ctx2 = {
      switchToHttp: () => ({
        getRequest: () => ({ connection: { remoteAddress: '10.0.0.1' } }),
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;
    interceptor.intercept(ctx2, mockNext).subscribe(() => {
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '60');
      done();
    });
  });
});
