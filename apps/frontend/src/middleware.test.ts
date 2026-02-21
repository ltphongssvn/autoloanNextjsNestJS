// apps/frontend/src/middleware.test.ts
import { describe, it, expect } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

function createRequest(path: string, cookie?: string): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  const req = new NextRequest(url);
  if (cookie) {
    Object.defineProperty(req, 'cookies', {
      value: { get: (name: string) => name === 'token' ? { value: cookie } : undefined },
    });
  }
  return req;
}

describe('middleware', () => {
  it('should allow public paths without token', () => {
    expect(middleware(createRequest('/')).status).toBe(200);
  });
  it('should allow /login without token', () => {
    expect(middleware(createRequest('/login')).status).toBe(200);
  });
  it('should allow /signup without token', () => {
    expect(middleware(createRequest('/signup')).status).toBe(200);
  });
  it('should allow /forgot-password without token', () => {
    expect(middleware(createRequest('/forgot-password')).status).toBe(200);
  });
  it('should allow /reset-password without token', () => {
    expect(middleware(createRequest('/reset-password')).status).toBe(200);
  });
  it('should allow /reset-password?token=x without token', () => { // pragma: allowlist secret
    expect(middleware(createRequest('/reset-password?token=abc')).status).toBe(200); // pragma: allowlist secret
  });
  it('should redirect /dashboard to /login when no token', () => { // pragma: allowlist secret
    const res = middleware(createRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('redirect=%2Fdashboard');
  });
  it('should allow /dashboard with token', () => { // pragma: allowlist secret
    const res = middleware(createRequest('/dashboard', makeJwt({ role: 'customer' })));
    expect(res.status).toBe(200);
  });
  it('should redirect nested dashboard paths without token', () => { // pragma: allowlist secret
    const res = middleware(createRequest('/dashboard/applications/1'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });
  it('should redirect customer from /dashboard/loan-officer to /dashboard', () => {
    const res = middleware(createRequest('/dashboard/loan-officer', makeJwt({ role: 'customer' })));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
    expect(res.headers.get('location')).not.toContain('loan-officer');
  });
  it('should redirect customer from /dashboard/underwriter to /dashboard', () => {
    const res = middleware(createRequest('/dashboard/underwriter', makeJwt({ role: 'customer' })));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
    expect(res.headers.get('location')).not.toContain('underwriter');
  });
  it('should redirect underwriter from /dashboard/loan-officer to /dashboard/underwriter', () => {
    const res = middleware(createRequest('/dashboard/loan-officer', makeJwt({ role: 'underwriter' })));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard/underwriter');
  });
  it('should redirect loan_officer from /dashboard/underwriter to /dashboard/loan-officer', () => {
    const res = middleware(createRequest('/dashboard/underwriter', makeJwt({ role: 'loan_officer' })));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard/loan-officer');
  });
  it('should allow loan_officer on /dashboard/loan-officer', () => {
    const res = middleware(createRequest('/dashboard/loan-officer', makeJwt({ role: 'loan_officer' })));
    expect(res.status).toBe(200);
  });
  it('should allow underwriter on /dashboard/underwriter', () => {
    const res = middleware(createRequest('/dashboard/underwriter', makeJwt({ role: 'underwriter' })));
    expect(res.status).toBe(200);
  });
  it('should handle invalid token gracefully', () => { // pragma: allowlist secret
    const res = middleware(createRequest('/dashboard/loan-officer', 'not-a-jwt'));
    expect(res.status).toBe(307);
  });
});
