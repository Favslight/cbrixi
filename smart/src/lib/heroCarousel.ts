export type HeroTextPosition = 'LEFT' | 'CENTER' | 'RIGHT';
export type HeroMediaType = 'IMAGE' | 'VIDEO';

export interface HeroCarouselSlide {
  id: string;
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  media_type?: HeroMediaType | null;
  image_url?: string | null;
  image_public_id?: string | null;
  mobile_image_url?: string | null;
  mobile_image_public_id?: string | null;
  video_url?: string | null;
  video_public_id?: string | null;
  mobile_video_url?: string | null;
  mobile_video_public_id?: string | null;
  alt_text?: string | null;
  link_url?: string | null;
  product_id?: string | null;
  badge_text?: string | null;
  accent_color?: string | null;
  text_position?: HeroTextPosition | null;
  display_order?: number | null;
  autoplay_seconds?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

interface HeroCarouselResponse {
  success?: boolean;
  message?: string;
  slides?: HeroCarouselSlide[];
  slide?: HeroCarouselSlide;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

export async function fetchHeroCarouselSlides(): Promise<HeroCarouselSlide[]> {
  const res = await fetch(`${API_URL}/api/hero-carousel`, { cache: 'no-store' });
  const data = (await res.json().catch(() => ({}))) as HeroCarouselResponse;
  if (!res.ok || data.success === false) return [];
  return Array.isArray(data.slides) ? data.slides : [];
}

export async function fetchAdminHeroCarouselSlides(params: { status?: string; page?: number; limit?: number } = {}) {
  const search = new URLSearchParams({
    status: params.status ?? 'all',
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  const res = await adminHeroFetch(`/api/admin/hero-carousel?${search.toString()}`);
  const data = (await res.json().catch(() => ({}))) as HeroCarouselResponse;
  return {
    ok: res.ok && data.success !== false,
    message: data.message,
    slides: Array.isArray(data.slides) ? data.slides : [],
    pagination: data.pagination,
  };
}

export async function saveAdminHeroCarouselSlide(id: string | null, formData: FormData) {
  const res = await adminHeroFetch(id ? `/api/admin/hero-carousel/${id}` : '/api/admin/hero-carousel', {
    method: id ? 'PATCH' : 'POST',
    body: formData,
  });
  const data = (await res.json().catch(() => ({}))) as HeroCarouselResponse;
  return { ok: res.ok && data.success !== false, message: data.message, slide: data.slide };
}

export async function deleteAdminHeroCarouselSlide(id: string) {
  const res = await adminHeroFetch(`/api/admin/hero-carousel/${id}`, { method: 'DELETE' });
  const data = (await res.json().catch(() => ({}))) as HeroCarouselResponse;
  return { ok: res.ok && data.success !== false, message: data.message };
}

export async function setAdminHeroCarouselActive(id: string, active: boolean) {
  const res = await adminHeroFetch(`/api/admin/hero-carousel/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' });
  const data = (await res.json().catch(() => ({}))) as HeroCarouselResponse;
  return { ok: res.ok && data.success !== false, message: data.message, slide: data.slide };
}

function adminHeroFetch(path: string, init: RequestInit = {}) {
  const token = typeof window === 'undefined' ? '' : localStorage.getItem('adminToken') ?? '';
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
