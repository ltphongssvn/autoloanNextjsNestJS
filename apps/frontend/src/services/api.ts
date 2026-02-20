// apps/frontend/src/services/api.ts
import type { ApiResponse, Application, User } from '@autoloan/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<ApiResponse<{ token: string; user: User }>>('/auth', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signup: (data: Record<string, string>) =>
      request<ApiResponse<{ token: string; user: User }>>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<void>('/auth/logout', { method: 'POST' }),
  },
  applications: {
    list: () => request<ApiResponse<Application[]>>('/applications'),
    get: (id: number) => request<ApiResponse<Application>>(`/applications/${id}`),
    create: (data: Record<string, unknown>) =>
      request<ApiResponse<Application>>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: number, status: string) =>
      request<ApiResponse<Application>>(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  documents: {
    list: (applicationId: number) =>
      request<ApiResponse<unknown[]>>(`/applications/${applicationId}/documents`),
    upload: (applicationId: number, data: Record<string, unknown>) =>
      request<ApiResponse<unknown>>(`/applications/${applicationId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (applicationId: number, docId: number, status: string) =>
      request<ApiResponse<unknown>>(`/applications/${applicationId}/documents/${docId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  notes: {
    list: (applicationId: number) =>
      request<ApiResponse<unknown[]>>(`/applications/${applicationId}/notes`),
    create: (applicationId: number, note: string, internal = false) =>
      request<ApiResponse<unknown>>(`/applications/${applicationId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note, internal }),
      }),
  },
  users: {
    me: () => request<ApiResponse<User>>('/users/me'),
    updateProfile: (data: Record<string, string>) =>
      request<ApiResponse<User>>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
