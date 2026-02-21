// apps/frontend/src/services/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (data: Record<string, string>) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    signup: (data: Record<string, string> | import('@autoloan/shared-types').SignupData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    refresh: () => request('/auth/refresh', { method: 'POST' }),
    requestPasswordReset: (email: string) => request('/auth/password/reset-request', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) => request('/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
  applications: {
    list: () => request('/applications'),
    get: (id: number) => request(`/applications/${id}`),
    create: (data: Record<string, unknown>) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) => request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: number) => request(`/applications/${id}`, { method: 'DELETE' }),
    submit: (id: number) => request(`/applications/${id}/submit`, { method: 'POST' }),
    sign: (id: number, signatureData: string) => request(`/applications/${id}/sign`, { method: 'POST', body: JSON.stringify({ signature_data: signatureData }) }),
    updateStatus: (id: number, status: string) => request(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    history: (id: number) => request(`/applications/${id}/history`),
  },
  loanOfficer: {
    list: () => request('/loan-officer/applications'),
    get: (id: number) => request(`/loan-officer/applications/${id}`),
    startVerification: (id: number) => request(`/loan-officer/applications/${id}/start-verification`, { method: 'POST' }),
    review: (id: number) => request(`/loan-officer/applications/${id}/review`, { method: 'POST' }),
    requestDocuments: (id: number, data: Record<string, unknown>) => request(`/loan-officer/applications/${id}/request-documents`, { method: 'POST', body: JSON.stringify(data) }),
    addNote: (id: number, note: string, internal = true) => request(`/loan-officer/applications/${id}/add-note`, { method: 'POST', body: JSON.stringify({ note, internal }) }),
    getNotes: (id: number) => request(`/loan-officer/applications/${id}/notes`),
  },
  underwriter: {
    list: () => request('/underwriter/applications'),
    get: (id: number) => request(`/underwriter/applications/${id}`),
    approve: (id: number, data: Record<string, unknown>) => request(`/underwriter/applications/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
    reject: (id: number, data: Record<string, unknown>) => request(`/underwriter/applications/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
    requestDocuments: (id: number, data: Record<string, unknown>) => request(`/underwriter/applications/${id}/request-documents`, { method: 'POST', body: JSON.stringify(data) }),
    addNote: (id: number, note: string, internal = true) => request(`/underwriter/applications/${id}/add-note`, { method: 'POST', body: JSON.stringify({ note, internal }) }),
    getNotes: (id: number) => request(`/underwriter/applications/${id}/notes`),
  },
  documents: {
    list: (applicationId: number) => request(`/applications/${applicationId}/documents`),
    get: (id: number) => request(`/documents/${id}`),
    upload: (applicationId: number, data: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(`${BASE_URL}/applications/${applicationId}/documents`, { method: 'POST', headers, body: data }).then(r => r.json());
    },
    remove: (id: number) => request(`/documents/${id}`, { method: 'DELETE' }),
    updateStatus: (id: number, status: string, rejectionNote?: string) => request(`/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejection_note: rejectionNote }) }),
  },
  notes: {
    list: (applicationId: number) => request(`/applications/${applicationId}/notes`),
    create: (applicationId: number, data: Record<string, unknown>) => request(`/applications/${applicationId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    me: () => request('/users/me'),
    updateProfile: (data: Record<string, string>) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },
};
