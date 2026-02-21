import { vi, describe, it, expect, beforeEach } from 'vitest';
import { api } from './api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
});

describe('api', () => {
  describe('auth', () => {
    it('login', async () => {
      await api.auth.login({ email: 'a@b.com', password: 'p' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.objectContaining({ method: 'POST' }));
    });
    it('signup', async () => {
      await api.auth.signup({ email: 'a@b.com', password: 'p', password_confirmation: 'p', first_name: 'A', last_name: 'B' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/signup'), expect.objectContaining({ method: 'POST' }));
    });
    it('refresh', async () => {
      await api.auth.refresh();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/refresh'), expect.objectContaining({ method: 'POST' }));
    });
    it('requestPasswordReset', async () => {
      await api.auth.requestPasswordReset('a@b.com');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/password/reset-request'), expect.objectContaining({ method: 'POST' }));
    });
    it('resetPassword', async () => {
      await api.auth.resetPassword('tok', 'newpass');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/password/reset'), expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('applications', () => {
    it('list', async () => { await api.applications.list(); expect(mockFetch).toHaveBeenCalled(); });
    it('get', async () => { await api.applications.get(1); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1'), expect.anything()); });
    it('create', async () => { await api.applications.create({ loanAmount: 1000 }); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications'), expect.objectContaining({ method: 'POST' })); });
    it('update', async () => { await api.applications.update(1, { loanAmount: 2000 }); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1'), expect.objectContaining({ method: 'PATCH' })); });
    it('remove', async () => { await api.applications.remove(1); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1'), expect.objectContaining({ method: 'DELETE' })); });
    it('submit', async () => { await api.applications.submit(1); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/submit'), expect.objectContaining({ method: 'POST' })); });
    it('sign', async () => { await api.applications.sign(1, 'sig'); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/1/sign'), expect.objectContaining({ method: 'POST' })); });
    it('updateStatus', async () => { await api.applications.updateStatus(1, 'approved'); expect(mockFetch).toHaveBeenCalled(); });
    it('history', async () => { await api.applications.history(1); expect(mockFetch).toHaveBeenCalled(); });
  });

  describe('loanOfficer', () => {
    it('list', async () => { await api.loanOfficer.list(); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/loan-officer/applications'), expect.anything()); });
    it('get', async () => { await api.loanOfficer.get(1); expect(mockFetch).toHaveBeenCalled(); });
    it('startVerification', async () => { await api.loanOfficer.startVerification(1); expect(mockFetch).toHaveBeenCalled(); });
    it('review', async () => { await api.loanOfficer.review(1); expect(mockFetch).toHaveBeenCalled(); });
    it('requestDocuments', async () => { await api.loanOfficer.requestDocuments(1, {}); expect(mockFetch).toHaveBeenCalled(); });
    it('addNote', async () => { await api.loanOfficer.addNote(1, 'note'); expect(mockFetch).toHaveBeenCalled(); });
    it('getNotes', async () => { await api.loanOfficer.getNotes(1); expect(mockFetch).toHaveBeenCalled(); });
  });

  describe('underwriter', () => {
    it('list', async () => { await api.underwriter.list(); expect(mockFetch).toHaveBeenCalled(); });
    it('get', async () => { await api.underwriter.get(1); expect(mockFetch).toHaveBeenCalled(); });
    it('approve', async () => { await api.underwriter.approve(1, {}); expect(mockFetch).toHaveBeenCalled(); });
    it('reject', async () => { await api.underwriter.reject(1, {}); expect(mockFetch).toHaveBeenCalled(); });
    it('requestDocuments', async () => { await api.underwriter.requestDocuments(1, {}); expect(mockFetch).toHaveBeenCalled(); });
    it('addNote', async () => { await api.underwriter.addNote(1, 'note'); expect(mockFetch).toHaveBeenCalled(); });
    it('getNotes', async () => { await api.underwriter.getNotes(1); expect(mockFetch).toHaveBeenCalled(); });
  });

  describe('documents', () => {
    it('list', async () => { await api.documents.list(1); expect(mockFetch).toHaveBeenCalled(); });
    it('get', async () => { await api.documents.get(1); expect(mockFetch).toHaveBeenCalled(); });
    it('upload', async () => { await api.documents.upload(1, new FormData()); expect(mockFetch).toHaveBeenCalled(); });
    it('remove', async () => { await api.documents.remove(1); expect(mockFetch).toHaveBeenCalled(); });
    it('updateStatus', async () => { await api.documents.updateStatus(1, 'verified'); expect(mockFetch).toHaveBeenCalled(); });
    it('updateStatus with rejection note', async () => { await api.documents.updateStatus(1, 'rejected', 'bad'); expect(mockFetch).toHaveBeenCalled(); });
  });

  describe('notes', () => {
    it('list', async () => { await api.notes.list(1); expect(mockFetch).toHaveBeenCalled(); });
    it('create', async () => { await api.notes.create(1, { note: 'hi' }); expect(mockFetch).toHaveBeenCalled(); });
  });

  describe('mfa', () => {
    it('status', async () => { await api.mfa.status(); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/mfa/status'), expect.anything()); });
    it('setup', async () => { await api.mfa.setup(); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/mfa/setup'), expect.objectContaining({ method: 'POST' })); });
    it('enable', async () => { await api.mfa.enable('123456'); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/mfa/enable'), expect.objectContaining({ method: 'POST' })); });
    it('disable', async () => { await api.mfa.disable('123456'); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/mfa/disable'), expect.objectContaining({ method: 'POST' })); });
    it('verify', async () => { await api.mfa.verify('123456'); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/mfa/verify'), expect.objectContaining({ method: 'POST' })); });
  });

  describe('apiKeys', () => {
    it('list', async () => { await api.apiKeys.list(); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/api-keys'), expect.anything()); });
    it('create', async () => { await api.apiKeys.create('my key'); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/api-keys'), expect.objectContaining({ method: 'POST' })); });
    it('create with expiresAt', async () => { await api.apiKeys.create('my key', '2030-01-01'); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/api-keys'), expect.objectContaining({ method: 'POST' })); });
    it('revoke', async () => { await api.apiKeys.revoke(1); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/api-keys/1/revoke'), expect.objectContaining({ method: 'PATCH' })); });
    it('remove', async () => { await api.apiKeys.remove(1); expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/api-keys/1'), expect.objectContaining({ method: 'DELETE' })); });
  });

  describe('users', () => {
    it('me', async () => { await api.users.me(); expect(mockFetch).toHaveBeenCalled(); });
    it('updateProfile', async () => { await api.users.updateProfile({ first_name: 'A' }); expect(mockFetch).toHaveBeenCalled(); });
  });

  describe('request error handling', () => {
    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ message: 'Unauthorized' }) });
      await expect(api.auth.login({ email: 'a', password: 'b' })).rejects.toThrow('Unauthorized');
    });
    it('should handle non-json error body', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject('no json') });
      await expect(api.applications.list()).rejects.toThrow('Request failed: 500');
    });
  });

  describe('auth token', () => {
    it('should send Authorization header when token exists', async () => {
      localStorage.setItem('token', 'my-token');
      await api.applications.list();
      const call = mockFetch.mock.calls[0];
      expect(call[1].headers['Authorization']).toBe('Bearer my-token');
    });
  });
});
