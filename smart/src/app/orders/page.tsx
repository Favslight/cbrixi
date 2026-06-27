"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../../../components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

type OrderStatus = "AWAITING_APPROVAL" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "REJECTED";

interface OrderLine {
  id?: string;
  name?: string;
  product_name?: string;
  quantity?: number;
  price?: string | number;
  amount?: string | number;
}

interface InstallmentLine {
  id?: string;
  amount?: string | number;
  due_date?: string;
  paid_at?: string | null;
  paid_amount?: string | number;
  remaining_amount?: string | number;
  status?: string;
  installment_number?: number;
  payment_type?: "INSTALLMENT_DEPOSIT" | "INSTALLMENT_PAYMENT" | "ORDER_PAYMENT" | string;
  payment_label?: string;
  can_pay?: boolean;
  transactions?: TransactionLine[];
}

interface TransactionLine {
  id?: string;
  reference?: string;
  amount?: string | number;
  status?: string;
  payment_method?: string;
  created_at?: string;
}

interface UserOrder {
  id: string;
  payment_mode: "FULL" | "INSTALLMENT" | string;
  status: OrderStatus | string;
  total_amount: string;
  deposit_amount?: string;
  remaining_balance?: string;
  external_email?: string;
  paid_amount?: number;
  payment_progress_percentage?: number;
  next_payment_amount?: number;
  next_payment_due_date?: string;
  next_installment?: InstallmentLine | null;
  can_pay?: boolean;
  can_pay_deposit?: boolean;
  can_pay_remaining_balance?: boolean;
  order_items?: OrderLine[];
  payment_schedule?: InstallmentLine[];
  installments?: InstallmentLine[];
  transactions?: TransactionLine[];
  created_at?: string;
}

const CLEARED_ORDERS_KEY = "cbrixi_cleared_order_ids";

const statusLabels: Record<OrderStatus, string> = {
  AWAITING_APPROVAL: "Pending admin approval",
  PENDING: "Approved, payment pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const statusClasses: Record<OrderStatus, string> = {
  AWAITING_APPROVAL: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  PENDING: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  PARTIALLY_PAID: "border-purple-500/25 bg-purple-500/10 text-purple-300",
  PAID: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/25 bg-red-500/10 text-red-300",
};

function fmtMoney(value?: string | number | null) {
  const numeric = Number(value ?? 0);
  return `N${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMonth(value?: string | null, fallback?: number) {
  if (!value) return fallback ? `Month ${fallback}` : "Installment";
  return new Date(value).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getStatusLabel(status: string) {
  return statusLabels[status as OrderStatus] ?? status;
}

function getStatusClass(status: string) {
  return statusClasses[status as OrderStatus] ?? "border-white/10 bg-white/5 text-white/60";
}

function isPaidStatus(status?: string) {
  return String(status ?? "").toUpperCase() === "PAID";
}

function isTerminalOrder(order: UserOrder) {
  return order.status === "PAID" || order.status === "REJECTED";
}

function getPaymentSchedule(order: UserOrder) {
  if (Array.isArray(order.payment_schedule) && order.payment_schedule.length > 0) {
    return order.payment_schedule;
  }

  return order.installments ?? [];
}

function getDepositItem(order: UserOrder) {
  return getPaymentSchedule(order).find((item) => item.payment_type === "INSTALLMENT_DEPOSIT") ?? null;
}

function getMonthlyItems(order: UserOrder) {
  return getPaymentSchedule(order).filter((item) => item.payment_type !== "INSTALLMENT_DEPOSIT");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [clearedOrderIds, setClearedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLEARED_ORDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setClearedOrderIds(parsed.filter((id) => typeof id === "string"));
      }
    } catch {
      localStorage.removeItem(CLEARED_ORDERS_KEY);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch(`${API_URL}/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const nextOrders = Array.isArray(data) ? data : data.orders ?? data.data ?? [];
        setOrders(nextOrders);
      } else {
        setOrdersError(data.message || "Failed to load orders");
      }
    } catch {
      setOrdersError("Connection error while loading orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders().catch(() => undefined);
  }, [fetchOrders]);

  const orderStats = useMemo(() => {
    const visibleOrders = orders.filter((order) => !clearedOrderIds.includes(order.id));
    const paid = visibleOrders.filter((order) => order.status === "PAID").length;
    const payable = visibleOrders.filter((order) => order.can_pay).length;
    const outstanding = visibleOrders.reduce((acc, order) => acc + Number(order.remaining_balance ?? 0), 0);
    return { paid, payable, outstanding };
  }, [clearedOrderIds, orders]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => !clearedOrderIds.includes(order.id)),
    [clearedOrderIds, orders]
  );

  const clearableOrdersCount = visibleOrders.filter(isTerminalOrder).length;

  const clearOrder = useCallback((orderId: string) => {
    setClearedOrderIds((current) => {
      const next = Array.from(new Set([...current, orderId]));
      localStorage.setItem(CLEARED_ORDERS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCompletedAndRejected = useCallback(() => {
    const terminalIds = orders.filter(isTerminalOrder).map((order) => order.id);
    setClearedOrderIds((current) => {
      const next = Array.from(new Set([...current, ...terminalIds]));
      localStorage.setItem(CLEARED_ORDERS_KEY, JSON.stringify(next));
      return next;
    });
  }, [orders]);

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-28 px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <Link href="/profile" className="text-sm text-white/45 hover:text-white">
              &lt;- Back to profile
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mt-4">Orders</h1>
            <p className="text-white/45 text-sm mt-2">Track approvals, balances, installments, and payment history.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchOrders()}
              className="w-fit rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              Refresh orders
            </button>
            <button
              onClick={clearCompletedAndRejected}
              disabled={clearableOrdersCount === 0}
              className="w-fit rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
            >
              Clear completed/rejected
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Orders" value={visibleOrders.length} />
          <StatCard label="Can Pay Now" value={orderStats.payable} />
          <StatCard label="Paid Orders" value={orderStats.paid} />
          <StatCard label="Outstanding" value={fmtMoney(orderStats.outstanding)} />
        </div>

        <AnimatePresence>
          {ordersError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {ordersError}
            </motion.div>
          )}
        </AnimatePresence>

        {ordersLoading ? (
          <div className="py-16 text-center text-white/45">Loading orders...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/45">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-5">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isExpanded={Boolean(expandedOrders[order.id])}
                onToggle={() => setExpandedOrders((current) => ({ ...current, [order.id]: !current[order.id] }))}
                onClear={() => clearOrder(order.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-white/45 text-xs mt-1">{label}</p>
    </div>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
  onClear,
}: {
  order: UserOrder;
  isExpanded: boolean;
  onToggle: () => void;
  onClear: () => void;
}) {
  const isInstallment = order.payment_mode === "INSTALLMENT";
  const isAwaitingApproval = order.status === "AWAITING_APPROVAL";
  const isRejected = order.status === "REJECTED";
  const isTerminal = isTerminalOrder(order);
  const firstItem = order.order_items?.[0];
  const productLabel = firstItem
    ? `${firstItem.name ?? firstItem.product_name ?? "Product"}${(order.order_items?.length ?? 0) > 1 ? ` +${(order.order_items?.length ?? 1) - 1}` : ""}`
    : "Order items";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
              {order.payment_mode}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{productLabel}</h2>
          <p className="font-mono text-xs text-white/45 break-all mt-1">Order {order.id}</p>
          {isInstallment && order.external_email && (
            <p className="text-sm text-blue-300 mt-2 break-all">Cbrilliance email: {order.external_email}</p>
          )}
          {isRejected && (
            <p className="text-sm text-red-300 mt-2">The submitted Cbrilliance email could not be verified. Please use the correct email or open an account on cbrilliance.io.</p>
          )}
          {isAwaitingApproval && (
            <p className="text-sm text-yellow-200/80 mt-2">Payment is disabled until admin approval.</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:w-[360px]">
          <MiniMetric label="Total" value={fmtMoney(order.total_amount)} />
          <MiniMetric label={isInstallment ? "Deposit" : "Paid"} value={fmtMoney(isInstallment ? order.deposit_amount : order.paid_amount)} />
          <MiniMetric label="Remaining" value={fmtMoney(order.remaining_balance)} />
          <MiniMetric label="Progress" value={`${Math.round(Number(order.payment_progress_percentage ?? 0))}%`} />
        </div>
      </div>

      {isInstallment && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <MiniMetric label="Next payment" value={fmtMoney(order.next_payment_amount)} />
          <MiniMetric label="Due date" value={fmtDate(order.next_payment_due_date)} />
          <MiniMetric label="Paid so far" value={fmtMoney(order.paid_amount)} />
        </div>
      )}

      {!isInstallment && order.can_pay && (
        <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/8 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-100">Pay order</p>
              <p className="text-xs text-blue-100/60 mt-1">Continue to bank checkout and submit this payment for admin approval.</p>
            </div>
            <PaymentLink order={order} label="Bank checkout" action="order" />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-white/8 pt-4">
        <button
          onClick={onToggle}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10"
        >
          {isExpanded ? "Hide details" : "Show more"}
        </button>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {isTerminal && (
          <button
            onClick={onClear}
            className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10"
          >
            Clear
          </button>
        )}
        {isInstallment && order.can_pay && !isExpanded && (
          <p className="text-xs text-white/45">Open details to pay a month or pay complete.</p>
        )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DetailList
                title="Products"
                emptyText="No product details"
                items={(order.order_items ?? []).map((item, index) => ({
                  key: item.id ?? `${order.id}-item-${index}`,
                  primary: item.name ?? item.product_name ?? "Product",
                  secondary: `Qty ${item.quantity ?? 1}`,
                  amount: item.amount ?? item.price,
                }))}
              />
              <InstallmentSchedule
                order={order}
              />
              <DetailList
                title="Transactions"
                emptyText="No transactions yet"
                items={(order.transactions ?? []).map((item, index) => ({
                  key: item.id ?? item.reference ?? `${order.id}-transaction-${index}`,
                  primary: fmtMoney(item.amount),
                  secondary: `${item.payment_method ?? "Payment"} - ${item.status ?? "Pending"}`,
                  amount: item.reference,
                }))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function InstallmentSchedule({
  order,
}: {
  order: UserOrder;
}) {
  const depositItem = getDepositItem(order);
  const monthlyItems = getMonthlyItems(order);
  const canPayDeposit = order.payment_mode === "INSTALLMENT" && order.can_pay_deposit === true && depositItem?.can_pay === true;
  const canPayComplete = order.payment_mode === "INSTALLMENT" && Boolean(order.can_pay) && order.status !== "PAID" && order.status !== "REJECTED";

  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <h3 className="text-sm font-bold mb-3">Installment payments</h3>
      {!depositItem && monthlyItems.length === 0 ? (
        <p className="text-white/35 text-sm">No installments yet</p>
      ) : (
        <div className="space-y-3">
          {depositItem && (
            <ScheduleRow
              key={depositItem.id ?? `${order.id}-deposit`}
              order={order}
              item={depositItem}
              fallbackLabel="First deposit"
              fallbackNumber={1}
              action="order"
              disabled={!canPayDeposit}
            />
          )}

          {monthlyItems.map((installment, index) => {
            const installmentId = installment.id ?? null;
            const canPayMonthly = installment.can_pay === true && Boolean(installmentId);

            return (
              <ScheduleRow
                key={installment.id ?? `${order.id}-installment-${index}`}
                order={order}
                item={installment}
                fallbackLabel={fmtMonth(installment.due_date, installment.installment_number ?? index + 1)}
                fallbackNumber={installment.installment_number ?? index + 1}
                action="installment"
                installmentId={installmentId}
                disabled={!canPayMonthly}
              />
            );
          })}
        </div>
      )}

      {order.payment_mode === "INSTALLMENT" && (
        <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/8 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-100">Pay complete</p>
              <p className="text-xs text-blue-100/60 mt-1">Pays the remaining balance and completes every unpaid month after approval.</p>
            </div>
            <PaymentButtons
              label="Pay complete"
              disabled={!canPayComplete}
              order={order}
              action="complete"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  order,
  item,
  fallbackLabel,
  fallbackNumber,
  action,
  installmentId,
  disabled,
}: {
  order: UserOrder;
  item: InstallmentLine;
  fallbackLabel: string;
  fallbackNumber: number;
  action: "order" | "installment";
  installmentId?: string | null;
  disabled: boolean;
}) {
  const paid = isPaidStatus(item.status);
  const label = item.payment_label ?? fallbackLabel;
  const payLabel = action === "order" ? "Pay first deposit" : `Pay ${label || `Month ${fallbackNumber}`}`;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/45 mt-1">{fmtMoney(item.remaining_amount ?? item.amount)} - {item.status ?? "Scheduled"}</p>
        </div>
        {paid ? (
          <span className="w-fit rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
            Paid
          </span>
        ) : (
          <PaymentLink
            order={order}
            installmentId={installmentId}
            label={payLabel}
            action={action}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

function PaymentButtons({
  order,
  label,
  disabled,
  action,
}: {
  order: UserOrder;
  label: string;
  disabled: boolean;
  action: "order" | "installment" | "complete";
}) {
  return <PaymentLink order={order} label={label} disabled={disabled} action={action} />;
}

function PaymentLink({
  order,
  installmentId,
  label,
  disabled,
  action,
}: {
  order: UserOrder;
  installmentId?: string | null;
  label: string;
  disabled?: boolean;
  action: "order" | "installment" | "complete";
}) {
  const params = new URLSearchParams({
    order_id: order.id,
    mode: order.payment_mode,
    action,
    label,
  });
  if (installmentId) {
    params.set("installment_id", installmentId);
  }

  if (disabled) {
    return (
      <span className="w-fit rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/35">
        Bank checkout
      </span>
    );
  }

  return (
    <Link
      href={`/payment?${params.toString()}`}
      className="w-fit rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-xs font-bold text-white"
    >
      {label}
    </Link>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 min-w-0">
      <p className="text-white/40 text-[11px] mb-1">{label}</p>
      <p className="text-white font-semibold text-sm break-words tabular-nums">{value}</p>
    </div>
  );
}

function DetailList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{ key: string; primary: string; secondary?: string; amount?: string | number }>;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-white/35 text-sm">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="border-b border-white/6 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-white break-words">{item.primary}</p>
              {item.secondary && <p className="text-xs text-white/45 mt-1">{item.secondary}</p>}
              {item.amount !== undefined && <p className="text-xs text-blue-300 mt-1 break-all">{typeof item.amount === "number" ? fmtMoney(item.amount) : item.amount}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
