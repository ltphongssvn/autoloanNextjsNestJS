// apps/backend/src/throttler.guard.spec.ts
import { CustomThrottlerGuard } from './throttler.guard';
import { ExecutionContext } from '@nestjs/common';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    guard = Object.create(CustomThrottlerGuard.prototype);
  });

  it('should return ip as tracker', async () => {
    const req = { ip: '127.0.0.1' };
    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('127.0.0.1');
  });

  it('should return unknown when ip missing', async () => {
    const tracker = await (guard as any).getTracker({});
    expect(tracker).toBe('unknown');
  });

  it('should return request and response from context', () => {
    const mockReq = { ip: '127.0.0.1' };
    const mockRes = { status: jest.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;
    const result = (guard as any).getRequestResponse(context);
    expect(result.req).toBe(mockReq);
    expect(result.res).toBe(mockRes);
  });
});
