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
  },
  applications: {
    list: () => request('/applications'),
    get: (id: number) => request(`/applications/${id}`),
    create: (data: Record<string, unknown>) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) => request(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    history: (id: number) => request(`/applications/${id}/history`),
  },
  documents: {
    list: (applicationId: number) => request(`/applications/${applicationId}/documents`),
    upload: (applicationId: number, data: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(`${BASE_URL}/applications/${applicationId}/documents`, { method: 'POST', headers, body: data }).then(r => r.json());
    },
    updateStatus: (id: number, status: string) => request(`/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
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
