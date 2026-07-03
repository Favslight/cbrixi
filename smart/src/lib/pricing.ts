export type ProductDiscountFields = {
  price: string | number;
  discount_enabled?: boolean;
  discount_percentage?: string | number;
  discount_amount?: string | number;
  discounted_price?: string | number;
  effective_price?: string | number;
};

export type DiscountPreview = Required<ProductDiscountFields>;

export function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const normalized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function hasActiveDiscount(product: ProductDiscountFields) {
  return product.discount_enabled === true && toNumber(product.discount_percentage) > 0;
}

export function getSellingPrice(product: ProductDiscountFields) {
  if (hasActiveDiscount(product)) {
    return product.discounted_price ?? product.effective_price ?? product.price;
  }

  return product.effective_price ?? product.price;
}

export function getCartUnitPrice(product: ProductDiscountFields) {
  return product.effective_price ?? getSellingPrice(product);
}

export function formatMoney(value: string | number | null | undefined) {
  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return String(value ?? '');

  return `\u20a6${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
