// apps/frontend/src/services/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: 'OK',
  json: vi.fn().mockResolvedValue(data),
});

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('test-token-value'), // pragma: allowlist secret
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('auth.login', () => {
    it('should POST to /auth with credentials', async () => {
      const { api } = await import('./api');
      const responseData = { status: { code: 200 }, data: { token: 'jwt', user: { id: 1 } } }; // pragma: allowlist secret
      mockFetch.mockResolvedValue(mockResponse(responseData));

      const result = await api.auth.login('test@test.com', 'testpass'); // pragma: allowlist secret
      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('auth.signup', () => {
    it('should POST to /auth/signup', async () => {
      const { api } = await import('./api');
      const responseData = { status: { code: 201 }, data: { token: 'jwt', user: { id: 1 } } }; // pragma: allowlist secret
      mockFetch.mockResolvedValue(mockResponse(responseData));

      const result = await api.auth.signup({ email: 'a@b.com', password: 'pass' }); // pragma: allowlist secret
      expect(result).toEqual(responseData);
    });
  });

  describe('applications.list', () => {
    it('should GET /applications with auth header', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: [] }));
      await api.applications.list();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token-value' }), // pragma: allowlist secret
        }),
      );
    });

    it('should omit auth header when no token', async () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: [] }));
      await api.applications.list();
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });

  describe('applications.get', () => {
    it('should GET /applications/:id', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      const result = await api.applications.get(1);
      expect(result).toEqual({ data: { id: 1 } });
    });
  });

  describe('applications.create', () => {
    it('should POST /applications', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      await api.applications.create({ loanAmount: 25000 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/applications'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('applications.updateStatus', () => {
    it('should PATCH /applications/:id/status', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1, status: 'approved' } }));
      await api.applications.updateStatus(1, 'approved');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/applications/1/status'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('error handling', () => {
    it('should throw on non-ok response with message', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ message: 'Unauthorized' }, false, 401));
      await expect(api.auth.login('a@b.com', 'wrong')).rejects.toThrow('Unauthorized'); // pragma: allowlist secret
    });

    it('should throw status text when no message in error body', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({}, false, 403));
      await expect(api.applications.list()).rejects.toThrow('Request failed: 403');
    });

    it('should handle non-json error response', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('not json')),
      });
      await expect(api.applications.list()).rejects.toThrow('Internal Server Error');
    });
  });
});
