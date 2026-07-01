import { apiRequest } from './api';

export type OrderStatus = 'AWAITING_APPROVAL' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REJECTED';

export type PaymentTransaction = {
  id?: string;
  order_id?: string;
  installment_id?: string | null;
  amount?: string | number;
  payment_method?: string;
  reference?: string;
  status?: string;
  created_at?: string;
  payment_type?: string;
  payment_label?: string;
};

export type PaymentScheduleItem = {
  id?: string;
  amount?: string | number;
  due_date?: string;
  paid_at?: string | null;
  status?: string;
  installment_number?: number;
  payment_type?: 'INSTALLMENT_DEPOSIT' | 'INSTALLMENT_PAYMENT' | 'ORDER_PAYMENT' | string;
  payment_label?: string;
  can_pay?: boolean;
  paid_amount?: string | number;
  remaining_amount?: string | number;
  transactions?: PaymentTransaction[];
};

export type OrderItem = {
  id?: string;
  order_id?: string;
  product_id?: string;
  quantity?: number;
  price_at_purchase?: string | number;
  name?: string;
  product_name?: string;
  price?: string | number;
  amount?: string | number;
  image_url?: string | null;
};

export type UserOrder = {
  id: string;
  user_id?: string;
  total_amount?: string | number;
  deposit_amount?: string | number;
  remaining_balance?: string | number;
  payment_mode: 'FULL' | 'INSTALLMENT' | string;
  status: OrderStatus | string;
  external_email?: string | null;
  created_at?: string;
  updated_at?: string;
  paid_amount?: string | number;
  payment_progress_percentage?: string | number;
  next_payment_amount?: string | number;
  next_payment_due_date?: string | null;
  can_pay?: boolean;
  can_pay_deposit?: boolean;
  can_pay_remaining_balance?: boolean;
  order_items?: OrderItem[];
  payment_schedule?: PaymentScheduleItem[];
  installments?: PaymentScheduleItem[];
  transactions?: PaymentTransaction[];
};

export type ManualTransferResponse = {
  reference: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  amount: number;
};

export function toNaira(value?: string | number | null): string {
  const numeric = Number(value ?? 0);
  return `N${Math.round(Number.isFinite(numeric) ? numeric : 0).toLocaleString()}`;
}

export function getPaymentSchedule(order: UserOrder): PaymentScheduleItem[] {
  if (Array.isArray(order.payment_schedule) && order.payment_schedule.length > 0) {
    return order.payment_schedule;
  }

  return order.installments ?? [];
}

export function getDepositScheduleItem(order: UserOrder): PaymentScheduleItem | null {
  return getPaymentSchedule(order).find((item) => item.payment_type === 'INSTALLMENT_DEPOSIT') ?? null;
}

export function getMonthlyScheduleItems(order: UserOrder): PaymentScheduleItem[] {
  return getPaymentSchedule(order).filter((item) => item.payment_type !== 'INSTALLMENT_DEPOSIT');
}

export async function fetchMyOrders(token: string): Promise<UserOrder[]> {
  const data = await apiRequest<UserOrder[] | { success?: boolean; orders?: UserOrder[]; data?: UserOrder[] }>(
    '/order/my-orders',
    { token },
  );

  if (Array.isArray(data)) return data;
  return data.orders ?? data.data ?? [];
}

export async function initiateManualTransfer(
  token: string,
  input: { orderId: string; installmentId?: string | null },
): Promise<ManualTransferResponse> {
  return apiRequest<ManualTransferResponse>('/payment/manual/initiate', {
    method: 'POST',
    token,
    body: {
      order_id: input.orderId,
      installment_id: input.installmentId ?? null,
    },
  });
}
