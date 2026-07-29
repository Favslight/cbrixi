import { API_URL, getAdminToken, getUserToken } from './api';

export interface ReceiptCompany {
  name?: string | null;
  legal_name?: string | null;
  tagline?: string | null;
  address?: string | null;
  email?: string | null;
  support_email?: string | null;
  phone?: string | null;
  website?: string | null;
  tax_id?: string | null;
  logo_url?: string | null;
}

export interface ReceiptItem {
  id?: string;
  name?: string | null;
  product_name?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: string | number | null;
  price?: string | number | null;
  line_total?: string | number | null;
  amount?: string | number | null;
  variant_name?: string | null;
}

export interface ReceiptCustomDetail {
  key: string;
  value: string;
}

export interface Receipt {
  id?: string;
  receipt_number: string;
  invoice_number?: string | null;
  order_id?: string | null;
  payment_id?: string | null;
  amount_paid?: string | number | null;
  remaining_balance?: string | number | null;
  total_amount?: string | number | null;
  paid_amount?: string | number | null;
  order_total?: string | number | null;
  currency?: string | null;
  status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  reference?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  email?: string | null;
  phone?: string | null;
  issued_at?: string | null;
  created_at?: string | null;
  payment_date?: string | null;
  items?: ReceiptItem[];
  custom_details?: ReceiptCustomDetail[];
  company?: ReceiptCompany | null;
  payment?: {
    id?: string;
    amount?: string | number | null;
    status?: string | null;
    payment_method?: string | null;
    reference?: string | null;
    remaining_balance?: string | number | null;
  } | null;
  order?: {
    id?: string;
    total_amount?: string | number | null;
    remaining_balance?: string | number | null;
    status?: string | null;
  } | null;
}

export interface ReceiptListParams {
  page?: number;
  limit?: number;
  order_id?: string;
  payment_id?: string;
}

export interface ReceiptListResult {
  receipts: Receipt[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export class ReceiptApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ReceiptApiError';
    this.status = status;
  }
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function messageFromBody(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
  }
  return fallback;
}

function isReceipt(value: unknown): value is Receipt {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as Receipt).receipt_number === 'string' &&
      (value as Receipt).receipt_number.length > 0
  );
}

/** Pull a receipt object from common API envelope shapes. */
export function extractReceipt(data: unknown): Receipt | null {
  if (!data) return null;
  if (isReceipt(data)) return data;
  if (typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (isReceipt(obj.receipt)) return obj.receipt;
  if (isReceipt(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === 'object' && isReceipt((obj.data as Record<string, unknown>).receipt)) {
    return (obj.data as Record<string, unknown>).receipt as Receipt;
  }
  return null;
}

function extractReceiptList(data: unknown): Receipt[] {
  if (Array.isArray(data)) {
    return data.filter(isReceipt);
  }
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  const candidates = [obj.receipts, obj.data, obj.items, obj.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(isReceipt);
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.receipts)) return nested.receipts.filter(isReceipt);
    }
  }
  const single = extractReceipt(data);
  return single ? [single] : [];
}

function extractPagination(data: unknown, receipts: Receipt[], params: ReceiptListParams): ReceiptListResult {
  const page = Number(params.page ?? 1) || 1;
  const limit = Number(params.limit ?? 20) || 20;
  let total = receipts.length;
  let total_pages = Math.max(1, Math.ceil(total / limit) || 1);

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const meta = (obj.pagination ?? obj.meta ?? obj) as Record<string, unknown>;
    if (typeof meta.total === 'number') total = meta.total;
    else if (typeof obj.total === 'number') total = obj.total;
    if (typeof meta.total_pages === 'number') total_pages = meta.total_pages;
    else if (typeof obj.total_pages === 'number') total_pages = obj.total_pages;
    else total_pages = Math.max(1, Math.ceil(total / limit) || 1);
  }

  return {
    receipts,
    page: Number((data as { page?: number })?.page ?? page) || page,
    limit,
    total,
    total_pages,
  };
}

function buildQuery(params: ReceiptListParams = {}): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.order_id) q.set('order_id', params.order_id);
  if (params.payment_id) q.set('payment_id', params.payment_id);
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function jsonFetch<T = unknown>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(token),
        ...options.headers,
      },
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} as T };
  }
}

export function receiptAmountPaid(receipt: Receipt): string | number | null | undefined {
  return (
    receipt.amount_paid ??
    receipt.paid_amount ??
    receipt.payment?.amount ??
    null
  );
}

export function receiptRemainingBalance(receipt: Receipt): string | number | null | undefined {
  return (
    receipt.remaining_balance ??
    receipt.payment?.remaining_balance ??
    receipt.order?.remaining_balance ??
    null
  );
}

export function receiptItemLabel(item: ReceiptItem): string {
  return item.name || item.product_name || item.description || 'Item';
}

export function receiptItemTotal(item: ReceiptItem): string | number | null | undefined {
  return item.line_total ?? item.amount ?? item.price ?? item.unit_price;
}

function requireUserToken(): string {
  const token = getUserToken();
  if (!token) throw new ReceiptApiError('Please sign in to view receipts.', 401);
  return token;
}

function requireAdminToken(): string {
  const token = getAdminToken();
  if (!token) throw new ReceiptApiError('Admin authentication required.', 401);
  return token;
}

function throwIfNotOk(ok: boolean, status: number, data: unknown, fallback: string): void {
  if (ok) return;
  throw new ReceiptApiError(messageFromBody(data, fallback), status);
}

/** Customer: list my receipts */
export async function listMyReceipts(params: ReceiptListParams = {}): Promise<ReceiptListResult> {
  const token = requireUserToken();
  const { ok, status, data } = await jsonFetch(`/receipts/me${buildQuery(params)}`, token);
  throwIfNotOk(ok, status, data, status === 403 ? 'Access denied.' : 'Failed to load receipts.');
  const receipts = extractReceiptList(data);
  return extractPagination(data, receipts, params);
}

/** Customer: receipts for one order (payment history) */
export async function listMyOrderReceipts(
  orderId: string,
  params: Omit<ReceiptListParams, 'order_id'> = {}
): Promise<ReceiptListResult> {
  const token = requireUserToken();
  const { ok, status, data } = await jsonFetch(
    `/receipts/me/order/${encodeURIComponent(orderId)}${buildQuery(params)}`,
    token
  );
  throwIfNotOk(
    ok,
    status,
    data,
    status === 404 ? 'No receipts found for this order.' : status === 403 ? 'Access denied.' : 'Failed to load payment history.'
  );
  const receipts = extractReceiptList(data);
  return extractPagination(data, receipts, params);
}

/** Customer: full receipt JSON */
export async function getMyReceipt(receiptNumber: string): Promise<Receipt> {
  const token = requireUserToken();
  const { ok, status, data } = await jsonFetch(
    `/receipts/me/${encodeURIComponent(receiptNumber)}`,
    token
  );
  throwIfNotOk(
    ok,
    status,
    data,
    status === 404 ? 'Receipt not found.' : status === 403 ? 'Access denied.' : 'Failed to load receipt.'
  );
  const receipt = extractReceipt(data);
  if (!receipt) throw new ReceiptApiError('Invalid receipt response.', status);
  return receipt;
}

function isFullReceiptForPrint(receipt: Receipt): boolean {
  // List stubs often include amount_paid but lack company/items — refetch those.
  return receipt.company != null || Array.isArray(receipt.items);
}

/**
 * Customer: Print using the same client receipt design as ReceiptDetailView.
 * Does not call backend /html.
 */
export async function printMyReceipt(
  receiptOrNumber: string | Receipt
): Promise<void> {
  const { printClientReceipt } = await import('./receiptPrint');
  const receipt =
    typeof receiptOrNumber === 'string'
      ? await getMyReceipt(receiptOrNumber)
      : isFullReceiptForPrint(receiptOrNumber)
        ? receiptOrNumber
        : await getMyReceipt(receiptOrNumber.receipt_number);
  await printClientReceipt(receipt);
}

/**
 * Customer: Download PDF from the same client receipt HTML (not backend /pdf).
 */
export async function downloadMyReceiptPdf(
  receiptOrNumber: string | Receipt
): Promise<void> {
  const { downloadClientReceiptPdf } = await import('./receiptPrint');
  const receipt =
    typeof receiptOrNumber === 'string'
      ? await getMyReceipt(receiptOrNumber)
      : isFullReceiptForPrint(receiptOrNumber)
        ? receiptOrNumber
        : await getMyReceipt(receiptOrNumber.receipt_number);
  await downloadClientReceiptPdf(receipt);
}

/** Admin: list receipts */
export async function listAdminReceipts(params: ReceiptListParams = {}): Promise<ReceiptListResult> {
  const token = requireAdminToken();
  const { ok, status, data } = await jsonFetch(`/admin/receipts${buildQuery(params)}`, token);
  throwIfNotOk(ok, status, data, status === 403 ? 'Access denied.' : 'Failed to load receipts.');
  const receipts = extractReceiptList(data);
  return extractPagination(data, receipts, params);
}

/** Admin: get (or backfill) receipt by payment id */
export async function getAdminReceiptByPayment(paymentId: string): Promise<Receipt> {
  const token = requireAdminToken();
  const { ok, status, data } = await jsonFetch(
    `/admin/receipts/payment/${encodeURIComponent(paymentId)}`,
    token
  );
  throwIfNotOk(
    ok,
    status,
    data,
    status === 404
      ? 'No receipt for this payment.'
      : status === 403
        ? 'Access denied.'
        : 'Failed to load receipt for payment.'
  );
  const receipt = extractReceipt(data);
  if (!receipt) throw new ReceiptApiError('Invalid receipt response.', status);
  return receipt;
}

/** Admin: full receipt JSON */
export async function getAdminReceipt(receiptNumber: string): Promise<Receipt> {
  const token = requireAdminToken();
  const { ok, status, data } = await jsonFetch(
    `/admin/receipts/${encodeURIComponent(receiptNumber)}`,
    token
  );
  throwIfNotOk(
    ok,
    status,
    data,
    status === 404 ? 'Receipt not found.' : status === 403 ? 'Access denied.' : 'Failed to load receipt.'
  );
  const receipt = extractReceipt(data);
  if (!receipt) throw new ReceiptApiError('Invalid receipt response.', status);
  return receipt;
}

/**
 * Admin: Print using the same client receipt design as ReceiptDetailView.
 * Does not call backend /html.
 */
export async function printAdminReceipt(
  receiptOrNumber: string | Receipt
): Promise<void> {
  const { printClientReceipt } = await import('./receiptPrint');
  const receipt =
    typeof receiptOrNumber === 'string'
      ? await getAdminReceipt(receiptOrNumber)
      : isFullReceiptForPrint(receiptOrNumber)
        ? receiptOrNumber
        : await getAdminReceipt(receiptOrNumber.receipt_number);
  await printClientReceipt(receipt);
}

/**
 * Admin: Download PDF from the same client receipt HTML (not backend /pdf).
 * Resend still uses the backend PDF for email attachments.
 */
export async function downloadAdminReceiptPdf(
  receiptOrNumber: string | Receipt
): Promise<void> {
  const { downloadClientReceiptPdf } = await import('./receiptPrint');
  const receipt =
    typeof receiptOrNumber === 'string'
      ? await getAdminReceipt(receiptOrNumber)
      : isFullReceiptForPrint(receiptOrNumber)
        ? receiptOrNumber
        : await getAdminReceipt(receiptOrNumber.receipt_number);
  await downloadClientReceiptPdf(receipt);
}

/** Admin: email PDF receipt to customer */
export async function resendAdminReceipt(receiptNumber: string): Promise<string> {
  const token = requireAdminToken();
  const { ok, status, data } = await jsonFetch(
    `/admin/receipts/${encodeURIComponent(receiptNumber)}/resend`,
    token,
    { method: 'POST' }
  );
  throwIfNotOk(ok, status, data, 'Failed to resend receipt.');
  return messageFromBody(data, 'Receipt resent successfully.');
}

/**
 * Resolve receipt number for an approved payment:
 * prefer embedded receipt / receipt_number, else backfill via payment id.
 */
export async function resolveAdminReceiptForPayment(payment: {
  id: string;
  receipt_number?: string | null;
  receipt?: Receipt | null;
}): Promise<Receipt> {
  if (payment.receipt && isReceipt(payment.receipt)) return payment.receipt;
  if (payment.receipt_number) {
    try {
      return await getAdminReceipt(payment.receipt_number);
    } catch {
      // fall through to payment lookup / backfill
    }
  }
  return getAdminReceiptByPayment(payment.id);
}
