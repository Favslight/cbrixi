import { API_BASE_URL, apiRequest } from './api';
import type { ApiProduct, ProductItem } from '../types/product';

function toNairaLabel(value: number): string {
  return `N${Math.round(value).toLocaleString()}`;
}

function parsePriceToNumber(price: string | number | undefined): number {
  if (typeof price === 'number' && Number.isFinite(price)) {
    return price;
  }

  if (typeof price !== 'string') {
    return 0;
  }

  const cleaned = price.replace(/[^\d.]/g, '');
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function resolveImageUri(raw: string | undefined | null): string | null {
  if (!raw) {
    return null;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith('/')) {
    return `${API_BASE_URL}${raw}`;
  }

  return `${API_BASE_URL}/${raw}`;
}

function normalizeProduct(input: ApiProduct): ProductItem {
  const priceValue = parsePriceToNumber(input.price);
  const durationMonths =
    typeof input.installment_duration_months === 'number' && input.installment_duration_months > 0
      ? input.installment_duration_months
      : 12;

  const monthlyValue = priceValue > 0 ? priceValue / durationMonths : 0;

  const primaryImage =
    input.image_url ||
    input.image ||
    (Array.isArray(input.image_urls) && input.image_urls.length ? input.image_urls[0] : undefined);

  const imageUris = Array.isArray(input.image_urls)
    ? input.image_urls.map((uri) => resolveImageUri(uri)).filter((uri): uri is string => Boolean(uri))
    : [];
  const resolvedPrimaryImage = resolveImageUri(primaryImage);

  return {
    id: String(input.id ?? Math.random().toString(36).slice(2)),
    name: input.name?.trim() || 'Unnamed Product',
    category: input.category?.trim() || 'General',
    description: input.description?.trim() || 'No description available.',
    priceValue,
    priceLabel: toNairaLabel(priceValue),
    monthlyLabel: monthlyValue > 0 ? `From ${toNairaLabel(monthlyValue)}/mo` : 'Price unavailable',
    imageUri: resolvedPrimaryImage,
    imageUris: resolvedPrimaryImage ? [resolvedPrimaryImage, ...imageUris.filter((uri) => uri !== resolvedPrimaryImage)] : imageUris,
    stock: typeof input.stock === 'number' ? input.stock : 0,
    installmentEnabled: Boolean(input.installment_enabled),
    installmentDurationMonths: durationMonths,
    minimumDepositPercentage:
      typeof input.minimum_deposit_percentage === 'number' ? input.minimum_deposit_percentage : 0,
    finePercentageOnDefault:
      typeof input.fine_percentage_on_default === 'number' ? input.fine_percentage_on_default : 0,
    minimumWalletBalanceRequired:
      typeof input.minimum_wallet_balance_required === 'number'
        ? input.minimum_wallet_balance_required
        : 0,
    gracePeriodDays: typeof input.grace_period_days === 'number' ? input.grace_period_days : 0,
  };
}

export async function fetchProducts(token?: string): Promise<ProductItem[]> {
  const response = await apiRequest<{ products?: ApiProduct[] }>('/products', {
    token,
  });

  return Array.isArray(response.products) ? response.products.map(normalizeProduct) : [];
}
