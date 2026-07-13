export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

export function getUserToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userToken');
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<{ res: Response; data: T }> {
  const { token, headers, ...rest } = options;
  const authToken = token ?? getUserToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { res, data };
}
