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
    it('should POST to /auth', async () => {
      const { api } = await import('./api');
      const data = { data: { token: 'jwt', user: { id: 1 } } }; // pragma: allowlist secret
      mockFetch.mockResolvedValue(mockResponse(data));
      const result = await api.auth.login('test@test.com', 'testpass'); // pragma: allowlist secret
      expect(result).toEqual(data);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('auth.signup', () => {
    it('should POST to /auth/signup', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: {} }));
      await api.auth.signup({ email: 'a@b.com', password: 'pass' }); // pragma: allowlist secret
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/signup'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('auth.logout', () => {
    it('should POST to /auth/logout', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse(undefined));
      await api.auth.logout();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('applications', () => {
    it('should GET /applications with auth header', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: [] }));
      await api.applications.list();
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBe('Bearer test-token-value'); // pragma: allowlist secret
    });

    it('should omit auth header when no token', async () => {
      vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() });
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: [] }));
      await api.applications.list();
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });

    it('should GET /applications/:id', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      await api.applications.get(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1'), expect.any(Object));
    });

    it('should POST /applications', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      await api.applications.create({ loanAmount: 25000 });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications'), expect.objectContaining({ method: 'POST' }));
    });

    it('should PATCH /applications/:id/status', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      await api.applications.updateStatus(1, 'approved');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/status'), expect.objectContaining({ method: 'PATCH' }));
    });
  });

  describe('documents', () => {
    it('should GET /applications/:id/documents', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: [] }));
      await api.documents.list(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/documents'), expect.any(Object));
    });

    it('should POST /applications/:id/documents', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: {} }));
      await api.documents.upload(1, { fileName: 'test.pdf' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/documents'), expect.objectContaining({ method: 'POST' }));
    });

    it('should PATCH document status', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: {} }));
      await api.documents.updateStatus(1, 5, 'approved');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/documents/5/status'), expect.objectContaining({ method: 'PATCH' }));
    });
  });

  describe('notes', () => {
    it('should GET /applications/:id/notes', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: [] }));
      await api.notes.list(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/notes'), expect.any(Object));
    });

    it('should POST /applications/:id/notes', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: {} }));
      await api.notes.create(1, 'Test note', true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/notes'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('users', () => {
    it('should GET /users/me', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      await api.users.me();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/users/me'), expect.any(Object));
    });

    it('should PATCH /users/me', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ data: { id: 1 } }));
      await api.users.updateProfile({ first_name: 'Jane' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/users/me'), expect.objectContaining({ method: 'PATCH' }));
    });
  });

  describe('error handling', () => {
    it('should throw on non-ok response with message', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({ message: 'Unauthorized' }, false, 401));
      await expect(api.auth.login('a@b.com', 'wrong')).rejects.toThrow('Unauthorized'); // pragma: allowlist secret
    });

    it('should throw status text when no message', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue(mockResponse({}, false, 403));
      await expect(api.applications.list()).rejects.toThrow('Request failed: 403');
    });

    it('should handle non-json error response', async () => {
      const { api } = await import('./api');
      mockFetch.mockResolvedValue({
        ok: false, status: 500, statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('not json')),
      });
      await expect(api.applications.list()).rejects.toThrow('Internal Server Error');
    });
  });
});
