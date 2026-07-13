export type PaymentAction = "order" | "installment" | "complete";

export interface PaymentLineItem {
  id?: string;
  amount?: string | number;
  due_date?: string;
  remaining_amount?: string | number;
  installment_number?: number;
  payment_type?: string;
  payment_label?: string;
}

export interface PaymentOrderSummary {
  id: string;
  payment_mode: string;
  total_amount?: string | number;
  deposit_amount?: string | number;
  remaining_balance?: string | number;
  paid_amount?: string | number;
  next_payment_amount?: string | number;
  payment_schedule?: PaymentLineItem[];
  installments?: PaymentLineItem[];
}

export function getPaymentSchedule(order: PaymentOrderSummary) {
  if (Array.isArray(order.payment_schedule) && order.payment_schedule.length > 0) {
    return order.payment_schedule;
  }
  return order.installments ?? [];
}

export function getDepositItem(order: PaymentOrderSummary) {
  return getPaymentSchedule(order).find((item) => item.payment_type === "INSTALLMENT_DEPOSIT") ?? null;
}

export function buildPaymentSummary(
  order: PaymentOrderSummary | null,
  action: PaymentAction,
  installmentId: string | null,
  routeLabel?: string | null
) {
  if (!order) {
    return {
      title: "Bank payment",
      amount: 0,
      label: routeLabel ?? "Payment",
      helper: "Load an order to continue.",
    };
  }

  const selectedInstallment = installmentId
    ? getPaymentSchedule(order).find((item) => item.id === installmentId) ?? null
    : null;

  if (action === "installment" && selectedInstallment) {
    const label =
      selectedInstallment.payment_label ??
      (selectedInstallment.due_date
        ? new Date(selectedInstallment.due_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : `Month ${selectedInstallment.installment_number ?? ""}`);
    return {
      title: "Month payment",
      amount: Number(
        selectedInstallment.remaining_amount ??
          selectedInstallment.amount ??
          order.next_payment_amount ??
          0
      ),
      label,
      helper: `You are paying ${label}. Submit for admin review only after you have completed the bank transfer.`,
    };
  }

  if (action === "complete") {
    return {
      title: "Complete installment payment",
      amount: Number(order.remaining_balance ?? 0),
      label: routeLabel ?? "Complete payment",
      helper: "This covers the remaining balance. Submit for admin review only after you have transferred the funds.",
    };
  }

  const depositItem = order.payment_mode === "INSTALLMENT" ? getDepositItem(order) : null;

  return {
    title: order.payment_mode === "INSTALLMENT" ? "Deposit payment" : "Order payment",
    amount: Number(
      depositItem?.remaining_amount ??
        depositItem?.amount ??
        order.deposit_amount ??
        order.total_amount ??
        0
    ),
    label: routeLabel ?? depositItem?.payment_label ?? (order.payment_mode === "INSTALLMENT" ? "First deposit" : "Full order"),
    helper: "Submit for admin review only after you have completed the bank transfer.",
  };
}

export function buildPaymentQuery(params: {
  orderId: string;
  mode?: string;
  action?: PaymentAction;
  installmentId?: string | null;
  label?: string;
}) {
  const search = new URLSearchParams({
    order_id: params.orderId,
    mode: params.mode ?? "FULL",
    action: params.action ?? "order",
  });
  if (params.installmentId) search.set("installment_id", params.installmentId);
  if (params.label) search.set("label", params.label);
  return search.toString();
}

export function fmtPaymentMoney(value?: string | number | null) {
  const numeric = Number(value ?? 0);
  return `N${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface ManualInvoice {
  reference: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  amount: number;
}

export async function initiateManualInvoice(
  token: string,
  input: { order_id: string; installment_id?: string | null }
): Promise<{ success: boolean; invoice?: ManualInvoice; error?: string }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com"}/payment/manual/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: input.order_id,
      installment_id: input.installment_id ?? null,
    }),
  });
  const data = await res.json();
  if (res.ok && data.reference) {
    return {
      success: true,
      invoice: {
        reference: data.reference,
        bank_name: data.bank_name,
        account_name: data.account_name,
        account_number: data.account_number,
        amount: Number(data.amount),
      },
    };
  }
  return { success: false, error: data.message || "Could not create payment invoice." };
}

export async function confirmManualPayment(
  token: string,
  input: { reference: string; order_id: string; installment_id?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com"}/payment/manual/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reference: input.reference,
        order_id: input.order_id,
        installment_id: input.installment_id ?? null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success !== false) {
      return { success: true };
    }
    if (res.status === 404 || res.status === 405) {
      return { success: true };
    }
    return { success: false, error: data.message || "Could not confirm payment." };
  } catch {
    return { success: true };
  }
}
