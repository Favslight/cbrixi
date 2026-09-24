import { API_URL, getAdminToken } from '@/lib/api';

export type InstallmentDisplayStatus = 'PAID' | 'MISSED' | 'UPCOMING';
export type InstallmentFilter = 'all' | 'defaulting' | 'current';

export interface InstallmentRecord {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string; // YYYY-MM-DD
  status: InstallmentDisplayStatus;
  paid_at: string | null;
  paid_late: boolean;
  days_overdue: number;
}

export interface InstallmentOrder {
  order_id: string;
  order_ref: string;
  order_status: string;
  order_summary: string | null;
  created_at: string;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  paid_amount: number;
  remaining_balance: number;
  paid_count: number;
  missed_count: number;
  late_paid_count: number;
  total_installments: number;
  overdue_amount: number;
  installments: InstallmentRecord[];
}

export interface InstallmentUser {
  user_id: string;
  name: string;
  email: string;
  is_defaulting: boolean;
  missed_count: number;
  paid_count: number;
  total_installments: number;
  overdue_amount: number;
  outstanding_amount: number;
  max_days_overdue: number;
  last_default_email_at: string | null;
  default_emails_sent: number;
  orders: InstallmentOrder[];
}

export interface InstallmentSummary {
  total_users: number;
  defaulting_users: number;
  current_users: number;
  total_missed_installments: number;
  total_overdue_amount: number;
  total_outstanding_amount: number;
}

export interface InstallmentPagination {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface DefaultEmailOutcome {
  user_id: string;
  email: string | null;
  reason?: string;
}

export interface DefaultEmailResult {
  sent: DefaultEmailOutcome[];
  skipped: DefaultEmailOutcome[];
  failed: DefaultEmailOutcome[];
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

export async function fetchAdminInstallments(params: {
  filter?: InstallmentFilter;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams({
    filter: params.filter ?? 'all',
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.search?.trim()) search.set('search', params.search.trim());

  try {
    const res = await adminFetch(`/api/admin/installments?${search.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { ok: false as const, message: (data.message as string) || 'Could not load installments.' };
    }
    return {
      ok: true as const,
      summary: data.summary as InstallmentSummary,
      users: (data.users ?? []) as InstallmentUser[],
      pagination: data.pagination as InstallmentPagination,
    };
  } catch {
    return { ok: false as const, message: 'Connection error.' };
  }
}

export async function sendDefaultEmails(body: { user_ids?: string[]; all?: boolean; force?: boolean }) {
  try {
    const res = await adminFetch('/api/admin/installments/default-emails', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      return { ok: false as const, message: (data.message as string) || 'Could not send emails.' };
    }
    return {
      ok: true as const,
      message: data.message as string,
      result: { sent: data.sent ?? [], skipped: data.skipped ?? [], failed: data.failed ?? [] } as DefaultEmailResult,
    };
  } catch {
    return { ok: false as const, message: 'Connection error.' };
  }
}
