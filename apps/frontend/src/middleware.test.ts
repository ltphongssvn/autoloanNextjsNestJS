// apps/frontend/src/middleware.test.ts
import { describe, it, expect, vi } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

function createRequest(path: string, cookie?: string): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  const req = new NextRequest(url);
  if (cookie) {
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => name === 'token' ? { value: cookie } : undefined,
      },
    });
  }
  return req;
}

describe('middleware', () => {
  it('should allow public paths without token', () => {
    const res = middleware(createRequest('/'));
    expect(res.status).toBe(200);
  });

  it('should allow /login without token', () => {
    const res = middleware(createRequest('/login'));
    expect(res.status).toBe(200);
  });

  it('should allow /signup without token', () => {
    const res = middleware(createRequest('/signup'));
    expect(res.status).toBe(200);
  });

  it('should redirect /dashboard to /login when no token', () => {
    const res = middleware(createRequest('/dashboard'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('redirect=%2Fdashboard');
  });

  it('should allow /dashboard with token', () => {
    const res = middleware(createRequest('/dashboard', 'valid-token')); // pragma: allowlist secret
    expect(res.status).toBe(200);
  });

  it('should redirect nested dashboard paths without token', () => {
    const res = middleware(createRequest('/dashboard/applications/1'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
  });
});
