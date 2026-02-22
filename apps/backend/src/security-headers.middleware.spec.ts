import { SecurityHeadersMiddleware } from './security-headers.middleware';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  const headers: Record<string, string> = {};
  const mockRes = { setHeader: jest.fn((k: string, v: string) => { headers[k] = v; }) } as any;
  const mockNext = jest.fn();

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
    jest.clearAllMocks();
  });

  it('should set all security headers and call next', () => {
    middleware.use({} as any, mockRes, mockNext);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining("default-src 'self'"));
    expect(mockRes.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cross-Origin-Embedder-Policy', 'unsafe-none');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cross-Origin-Resource-Policy', 'cross-origin');
    expect(mockRes.setHeader).toHaveBeenCalledTimes(10);
    expect(mockNext).toHaveBeenCalled();
  });
});
