import { API_URL, getAdminToken, getUserToken } from './api';

export const CAMPAIGN_SESSION_KEY = 'cbrixi_campaign_session_id';

export type CampaignType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'PROMOTED_PRODUCT';

export type CampaignPlacement =
  | 'LANDING_POPUP'
  | 'HERO_BANNER'
  | 'TOP_BANNER'
  | 'BOTTOM_BANNER'
  | 'CATEGORY_PAGE'
  | 'PRODUCT_PAGE'
  | 'SIDEBAR'
  | 'FOOTER';

export type CampaignStatusFilter = 'active' | 'expired' | 'scheduled' | '';

export interface CampaignProduct {
  id: string;
  name?: string;
  description?: string | null;
  price?: string | number;
  effective_price?: string | number;
  discounted_price?: string | number;
  discount_enabled?: boolean;
  discount_percentage?: string | number;
  image_url?: string | null;
  image?: string | null;
  image_urls?: string[];
  category?: string | null;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  campaign_type: CampaignType;
  placement: CampaignPlacement;
  media_url?: string | null;
  thumbnail_url?: string | null;
  product_id?: string | null;
  product?: CampaignProduct | null;
  popup_delay_seconds?: number | null;
  display_duration_seconds?: number | null;
  allow_skip_after_seconds?: number | null;
  priority?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  view_count?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignStats {
  total?: number;
  active?: number;
  scheduled?: number;
  expired?: number;
  total_views?: number;
  most_viewed?: Campaign | null;
  most_viewed_title?: string | null;
  most_viewed_views?: number | null;
}

export interface CampaignListParams {
  status?: CampaignStatusFilter;
  placement?: CampaignPlacement | '';
  type?: CampaignType | '';
  page?: number;
  limit?: number;
}

export interface CampaignPayload {
  title: string;
  description?: string;
  campaign_type: CampaignType;
  placement: CampaignPlacement;
  product_id?: string | null;
  popup_delay_seconds?: number | null;
  display_duration_seconds?: number | null;
  allow_skip_after_seconds?: number | null;
  priority?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  media_url?: string | null;
  thumbnail_url?: string | null;
}

export const CAMPAIGN_TYPES: CampaignType[] = ['IMAGE', 'VIDEO', 'TEXT', 'PROMOTED_PRODUCT'];

export const CAMPAIGN_PLACEMENTS: CampaignPlacement[] = [
  'LANDING_POPUP',
  'HERO_BANNER',
  'TOP_BANNER',
  'BOTTOM_BANNER',
  'CATEGORY_PAGE',
  'PRODUCT_PAGE',
  'SIDEBAR',
  'FOOTER',
];

export function getCampaignSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CAMPAIGN_SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CAMPAIGN_SESSION_KEY, id);
  }
  return id;
}

export function getOptionalUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('userData');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { id?: string; user_id?: string };
    return parsed.id || parsed.user_id || undefined;
  } catch {
    return undefined;
  }
}

function sortByPriority(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

function extractCampaigns(data: unknown): Campaign[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.campaigns)) return obj.campaigns as Campaign[];
  if (Array.isArray(obj.data)) return obj.data as Campaign[];
  if (Array.isArray(data)) return data as Campaign[];
  return [];
}

function extractCampaign(data: unknown): Campaign | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (obj.campaign && typeof obj.campaign === 'object') return obj.campaign as Campaign;
  if (obj.id) return obj as Campaign;
  return null;
}

function extractStats(data: unknown): CampaignStats {
  if (!data || typeof data !== 'object') return {};
  const obj = data as Record<string, unknown>;
  if (obj.stats && typeof obj.stats === 'object') return obj.stats as CampaignStats;
  return obj as CampaignStats;
}

async function publicFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<{ ok: boolean; data: T }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: {} as T };
  }
}

async function adminFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<{ ok: boolean; data: T; status: number }> {
  const token = getAdminToken();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, data: {} as T, status: 0 };
  }
}

/** Public: fetch active campaigns for a placement */
export async function fetchHomepageCampaigns(placement: CampaignPlacement): Promise<Campaign[]> {
  const { ok, data } = await publicFetch(`/api/campaigns/homepage?placement=${encodeURIComponent(placement)}`);
  if (!ok) return [];
  return sortByPriority(extractCampaigns(data));
}

/** Public: record a campaign view once shown */
export async function recordCampaignView(campaignId: string): Promise<boolean> {
  const session_id = getCampaignSessionId();
  if (!session_id || !campaignId) return false;
  const user_id = getOptionalUserId();
  const body: { campaign_id: string; session_id: string; user_id?: string } = {
    campaign_id: campaignId,
    session_id,
  };
  if (user_id) body.user_id = user_id;

  // Include user token when available (backend may ignore)
  const token = getUserToken();
  const { ok } = await publicFetch('/api/campaigns/view', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
  return ok;
}

export async function fetchAdminCampaignStats(): Promise<CampaignStats> {
  const { ok, data } = await adminFetch('/api/admin/campaigns/stats');
  if (!ok) return {};
  return extractStats(data);
}

export async function fetchAdminCampaigns(params: CampaignListParams = {}): Promise<{
  campaigns: Campaign[];
  total?: number;
  page?: number;
  limit?: number;
}> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.placement) qs.set('placement', params.placement);
  if (params.type) qs.set('type', params.type);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  const { ok, data } = await adminFetch(`/api/admin/campaigns${query ? `?${query}` : ''}`);
  if (!ok) return { campaigns: [] };
  const obj = data as Record<string, unknown>;
  return {
    campaigns: extractCampaigns(data),
    total: typeof obj.total === 'number' ? obj.total : undefined,
    page: typeof obj.page === 'number' ? obj.page : undefined,
    limit: typeof obj.limit === 'number' ? obj.limit : undefined,
  };
}

export async function fetchAdminCampaign(id: string): Promise<Campaign | null> {
  const { ok, data } = await adminFetch(`/api/admin/campaigns/${id}`);
  if (!ok) return null;
  return extractCampaign(data);
}

export async function createAdminCampaign(
  payload: CampaignPayload,
  files?: { media?: File | null; thumbnail?: File | null }
): Promise<{ ok: boolean; campaign: Campaign | null; message?: string }> {
  const hasFiles = Boolean(files?.media || files?.thumbnail);
  if (hasFiles) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });
    if (files?.media) formData.append('media', files.media);
    if (files?.thumbnail) formData.append('thumbnail', files.thumbnail);
    const { ok, data } = await adminFetch('/api/admin/campaigns', { method: 'POST', body: formData });
    const message = (data as { message?: string }).message;
    return { ok, campaign: extractCampaign(data), message };
  }

  const { ok, data } = await adminFetch('/api/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const message = (data as { message?: string }).message;
  return { ok, campaign: extractCampaign(data), message };
}

export async function updateAdminCampaign(
  id: string,
  payload: Partial<CampaignPayload>,
  files?: { media?: File | null; thumbnail?: File | null }
): Promise<{ ok: boolean; campaign: Campaign | null; message?: string }> {
  const hasFiles = Boolean(files?.media || files?.thumbnail);
  if (hasFiles) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });
    if (files?.media) formData.append('media', files.media);
    if (files?.thumbnail) formData.append('thumbnail', files.thumbnail);
    const { ok, data } = await adminFetch(`/api/admin/campaigns/${id}`, { method: 'PATCH', body: formData });
    const message = (data as { message?: string }).message;
    return { ok, campaign: extractCampaign(data), message };
  }

  const { ok, data } = await adminFetch(`/api/admin/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const message = (data as { message?: string }).message;
  return { ok, campaign: extractCampaign(data), message };
}

export async function deleteAdminCampaign(id: string): Promise<{ ok: boolean; message?: string }> {
  const { ok, data } = await adminFetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
  return { ok, message: (data as { message?: string }).message };
}

export async function activateAdminCampaign(id: string): Promise<{ ok: boolean; message?: string }> {
  const { ok, data } = await adminFetch(`/api/admin/campaigns/${id}/activate`, { method: 'PATCH' });
  return { ok, message: (data as { message?: string }).message };
}

export async function deactivateAdminCampaign(id: string): Promise<{ ok: boolean; message?: string }> {
  const { ok, data } = await adminFetch(`/api/admin/campaigns/${id}/deactivate`, { method: 'PATCH' });
  return { ok, message: (data as { message?: string }).message };
}

export function productImage(product?: CampaignProduct | null): string {
  if (!product) return '/images/smartwatch.png';
  if (product.image_urls?.length) return product.image_urls[0];
  return product.image_url || product.image || '/images/smartwatch.png';
}

export function placementLabel(placement: CampaignPlacement): string {
  return placement.replace(/_/g, ' ');
}
