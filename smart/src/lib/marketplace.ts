import { API_URL, getAdminToken } from '@/lib/api';

export interface MarketplaceStatus {
  locked: boolean;
  title: string;
  message: string;
  locked_at: string | null;
  updated_at: string | null;
}

interface MarketplaceResponse extends Partial<MarketplaceStatus> {
  success?: boolean;
  message?: string;
}

const toStatus = (data: MarketplaceResponse): MarketplaceStatus => ({
  locked: data.locked === true,
  title: data.title || 'Marketplace under review',
  message: data.message || 'Our marketplace is currently under review. Please check back later.',
  locked_at: data.locked_at ?? null,
  updated_at: data.updated_at ?? null,
});

/**
 * Public status check used by the storefront. Returns null when the status
 * cannot be determined so callers can fail open — the API itself still
 * rejects product/cart/checkout requests while the marketplace is locked.
 */
export async function fetchMarketplaceStatus(): Promise<MarketplaceStatus | null> {
  try {
    const res = await fetch(`${API_URL}/api/marketplace/status`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as MarketplaceResponse;
    return toStatus(data);
  } catch {
    return null;
  }
}

function adminFetch(path: string, init: RequestInit = {}) {
  const token = getAdminToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

async function adminCall(path: string, init: RequestInit = {}) {
  try {
    const res = await adminFetch(path, init);
    const data = (await res.json().catch(() => ({}))) as MarketplaceResponse;
    return {
      ok: res.ok && data.success !== false,
      message: data.message,
      status: res.ok ? toStatus(data) : null,
    };
  } catch {
    return { ok: false, message: 'Connection error.', status: null };
  }
}

export const fetchAdminMarketplaceStatus = () => adminCall('/api/admin/marketplace/status');

export const lockAdminMarketplace = (input: { title?: string; message?: string }) =>
  adminCall('/api/admin/marketplace/lock', { method: 'PATCH', body: JSON.stringify(input) });

export const unlockAdminMarketplace = () =>
  adminCall('/api/admin/marketplace/unlock', { method: 'PATCH' });
