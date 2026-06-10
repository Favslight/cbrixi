import { apiRequest } from './api';

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: string | number;
  image_url?: string;
  image?: string;
  installment_enabled?: boolean;
  installment_duration_months?: number;
  minimum_deposit_percentage?: number;
};

type CartResponse = {
  success?: boolean;
  cart?: CartItem[];
  message?: string;
};

function parsePriceNumber(value: string | number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = value.replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toNaira(value: number): string {
  return `N${Math.round(value).toLocaleString()}`;
}

export function cartItemUnitPrice(item: CartItem): number {
  return parsePriceNumber(item.price);
}

export function cartItemLineTotal(item: CartItem): number {
  return cartItemUnitPrice(item) * item.quantity;
}

export async function fetchCart(token: string): Promise<CartItem[]> {
  const data = await apiRequest<CartResponse>('/cart', { token });
  return Array.isArray(data.cart) ? data.cart : [];
}

export async function addToCart(token: string, productId: string, quantity = 1): Promise<boolean> {
  const data = await apiRequest<{ success?: boolean }>('/cart/add', {
    method: 'POST',
    token,
    body: { product_id: productId, quantity },
  });
  return Boolean(data.success ?? true);
}

export async function updateCartItemQuantity(token: string, itemId: string, quantity: number): Promise<boolean> {
  const data = await apiRequest<{ success?: boolean }>('/cart/item/' + itemId, {
    method: 'PATCH',
    token,
    body: { quantity },
  });
  return Boolean(data.success ?? true);
}

export async function deleteCartItem(token: string, itemId: string): Promise<boolean> {
  const data = await apiRequest<{ success?: boolean }>('/cart/item/' + itemId, {
    method: 'DELETE',
    token,
  });
  return Boolean(data.success ?? true);
}

export async function checkoutCart(
  token: string,
  paymentMode: 'FULL' | 'INSTALLMENT',
  externalEmail?: string,
): Promise<{ success?: boolean; order?: { order?: { id?: string } }; message?: string }> {
  return apiRequest<{ success?: boolean; order?: { order?: { id?: string } }; message?: string }>('/order/checkout', {
    method: 'POST',
    token,
    body: {
      payment_mode: paymentMode,
      externalEmail: paymentMode === 'INSTALLMENT' ? externalEmail ?? null : null,
    },
  });
}
