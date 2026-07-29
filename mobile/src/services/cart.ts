import { API_BASE_URL, apiRequest, type ApiError } from './api';

export type CartItem = {
  id: string;
  cart_item_id?: string;
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

export async function deleteCartItem(token: string, itemId: string, productId?: string): Promise<boolean> {
  try {
    const data = await apiRequest<{ success?: boolean }>('/cart/item/' + itemId, {
      method: 'DELETE',
      token,
    });
    return Boolean(data.success ?? true);
  } catch (error) {
    if (!productId || productId === itemId) {
      throw error;
    }
  }

  const data = await apiRequest<{ success?: boolean }>('/cart/item/' + productId, {
    method: 'DELETE',
    token,
  });
  return Boolean(data.success ?? true);
}

export type CheckoutOrder = {
  id?: string;
  status?: string;
  external_email?: string | null;
  total_amount?: string | number;
  deposit_amount?: string | number;
  remaining_amount?: string | number;
  remaining_balance?: string | number;
};

export type CheckoutPaymentSummary = {
  total_amount?: string | number;
  deposit_amount?: string | number;
  remaining_amount?: string | number;
};

export type CheckoutResponse = {
  success?: boolean;
  /** Backend may return `{ order: Order }` or nested `{ order: { order: Order } }`. */
  order?: CheckoutOrder | { order?: CheckoutOrder };
  payment_summary?: CheckoutPaymentSummary;
  message?: string;
};

/** Normalize checkout payload the same way web does: `data.order?.order ?? data.order`. */
export function getCheckoutOrder(response: CheckoutResponse): CheckoutOrder | null {
  const raw = response.order;
  if (!raw || typeof raw !== 'object') return null;

  if ('order' in raw && raw.order && typeof raw.order === 'object') {
    return raw.order;
  }

  return raw as CheckoutOrder;
}

/**
 * Place order via POST /order/checkout.
 * Mirrors web checkout: parse JSON body and let the caller decide from `success`
 * (do not hard-fail solely on HTTP status when a body is present).
 */
export async function checkoutCart(
  token: string,
  paymentMode: 'FULL' | 'INSTALLMENT',
  externalEmail?: string,
): Promise<CheckoutResponse> {
  const body: { payment_mode: 'FULL' | 'INSTALLMENT'; externalEmail?: string } = {
    payment_mode: paymentMode,
  };
  if (paymentMode === 'INSTALLMENT' && externalEmail) {
    body.externalEmail = externalEmail;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}/order/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: CheckoutResponse = {};
    try {
      data = (await response.json()) as CheckoutResponse;
    } catch {
      if (!response.ok) {
        throw { message: 'Checkout failed. Please try again.', status: response.status } satisfies ApiError;
      }
      return { success: false, message: 'Checkout failed. Please try again.' };
    }

    return data;
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      throw error as ApiError;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw { message: 'Request timed out. Please try again.' } satisfies ApiError;
    }
    throw { message: 'Connection error during checkout. Please try again.' } satisfies ApiError;
  } finally {
    clearTimeout(timeoutId);
  }
}
