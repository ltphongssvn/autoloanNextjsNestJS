// apps/frontend/src/services/api.test.ts
// pragma: allowlist secret
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue('test-token'), setItem: vi.fn(), removeItem: vi.fn() });
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 'ok' }) });
});

describe('api', () => {
  describe('auth', () => {
    it('login sends POST', async () => {
      await api.auth.login({ email: 'a@b.com', password: 'pw' }); // pragma: allowlist secret
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.objectContaining({ method: 'POST' }));
    });

    it('signup sends POST', async () => {
      await api.auth.signup({ email: 'a@b.com', password: 'pw' }); // pragma: allowlist secret
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/signup'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('applications', () => {
    it('list sends GET', async () => {
      await api.applications.list();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications'), expect.any(Object));
    });

    it('get sends GET with id', async () => {
      await api.applications.get(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1'), expect.any(Object));
    });

    it('create sends POST', async () => {
      await api.applications.create({ loanAmount: 25000 });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications'), expect.objectContaining({ method: 'POST' }));
    });

    it('updateStatus sends PATCH', async () => {
      await api.applications.updateStatus(1, 'approved');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/status'), expect.objectContaining({ method: 'PATCH' }));
    });

    it('history sends GET', async () => {
      await api.applications.history(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/history'), expect.any(Object));
    });
  });

  describe('documents', () => {
    it('list sends GET', async () => {
      await api.documents.list(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/documents'), expect.any(Object));
    });

    it('upload sends POST with FormData', async () => {
      mockFetch.mockResolvedValue({ json: () => Promise.resolve({ data: 'ok' }) });
      const formData = new FormData();
      await api.documents.upload(1, formData);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/documents'), expect.objectContaining({ method: 'POST', body: formData }));
    });

    it('updateStatus sends PATCH', async () => {
      await api.documents.updateStatus(1, 'verified');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/documents/1/status'), expect.objectContaining({ method: 'PATCH' }));
    });
  });

  describe('notes', () => {
    it('list sends GET', async () => {
      await api.notes.list(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/notes'), expect.any(Object));
    });

    it('create sends POST', async () => {
      await api.notes.create(1, { note: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/notes'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('users', () => {
    it('me sends GET', async () => {
      await api.users.me();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/users/me'), expect.any(Object));
    });

    it('updateProfile sends PATCH', async () => {
      await api.users.updateProfile({ first_name: 'John' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/users/me'), expect.objectContaining({ method: 'PATCH' }));
    });
  });

  describe('error handling', () => {
    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ message: 'Unauthorized' }) });
      await expect(api.auth.login({ email: '', password: '' })).rejects.toThrow('Unauthorized');
    });

    it('throws generic error when json parse fails', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error()) });
      await expect(api.auth.login({ email: '', password: '' })).rejects.toThrow('Request failed: 500');
    });
  });

  describe('auth headers', () => {
    it('includes token when available', async () => {
      await api.applications.list();
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('omits token when not available', async () => {
      vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null) });
      await api.applications.list();
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });
  });
});
