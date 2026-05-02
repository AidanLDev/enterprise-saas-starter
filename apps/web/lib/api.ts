import { config } from './config';
import { getIdToken } from './auth';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const baseUrl = config.apiUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || 'Request failed');
  }

  return body;
}
