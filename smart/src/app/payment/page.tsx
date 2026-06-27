"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

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
  paid_amount?: string | number;
  remaining_amount?: string | number;
  status?: string;
  installment_number?: number;
  payment_type?: "INSTALLMENT_DEPOSIT" | "INSTALLMENT_PAYMENT" | "ORDER_PAYMENT" | string;
  payment_label?: string;
  can_pay?: boolean;
}

interface UserOrder {
  id: string;
  payment_mode: "FULL" | "INSTALLMENT" | string;
  status: string;
  total_amount?: string | number;
  deposit_amount?: string | number;
  remaining_balance?: string | number;
  paid_amount?: string | number;
  next_payment_amount?: string | number;
  next_payment_due_date?: string;
  order_items?: OrderLine[];
  payment_schedule?: InstallmentLine[];
  installments?: InstallmentLine[];
}

interface BankDetails {
  reference: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  amount: number;
}

const Spinner = ({ sm }: { sm?: boolean }) => (
  <svg className={`animate-spin text-white ${sm ? "w-4 h-4" : "w-8 h-8"}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

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
  if (!value) return fallback ? `Month ${fallback}` : "Selected month";
  return new Date(value).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getItemName(item: OrderLine) {
  return item.name ?? item.product_name ?? "Product";
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

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();

  const orderId = params.get("order_id") || "";
  const installmentId = params.get("installment_id") || null;
  const action = (params.get("action") || "order") as "order" | "installment" | "complete";

  const [order, setOrder] = useState<UserOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!orderId) {
      router.push("/orders");
      return;
    }

    setLoadingOrder(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const orders: UserOrder[] = Array.isArray(data) ? data : data.orders ?? data.data ?? [];

      if (!res.ok) {
        setError(data.message || "Failed to load order.");
        return;
      }

      const foundOrder = orders.find((candidate) => candidate.id === orderId);
      if (!foundOrder) {
        setError("Order not found.");
        return;
      }

      setOrder(foundOrder);
    } catch {
      setError("Connection error while loading order.");
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder().catch(() => undefined);
  }, [fetchOrder]);

  const selectedInstallment = useMemo(() => {
    if (!order || !installmentId) return null;
    return getPaymentSchedule(order).find((item) => item.id === installmentId) ?? null;
  }, [installmentId, order]);

  const paymentSummary = useMemo(() => {
    if (!order) {
      return {
        title: "Bank payment",
        amount: 0,
        label: "Payment",
        helper: "Load an order to continue.",
      };
    }

    if (action === "installment" && selectedInstallment) {
      const label = selectedInstallment.payment_label ?? fmtMonth(selectedInstallment.due_date, selectedInstallment.installment_number);
      return {
        title: "Month payment",
        amount: Number(selectedInstallment.remaining_amount ?? selectedInstallment.amount ?? order.next_payment_amount ?? 0),
        label,
        helper: `This invoice is for ${label}. It will wait for admin approval after you submit it.`,
      };
    }

    if (action === "complete") {
      return {
        title: "Complete installment payment",
        amount: Number(order.remaining_balance ?? 0),
        label: "Complete payment",
        helper: "This invoice covers the remaining balance. Admin approval will mark the remaining installments as settled.",
      };
    }

    const depositItem = order.payment_mode === "INSTALLMENT" ? getDepositItem(order) : null;

    return {
      title: order.payment_mode === "INSTALLMENT" ? "Deposit payment" : "Order payment",
      amount: Number(depositItem?.remaining_amount ?? depositItem?.amount ?? order.deposit_amount ?? order.total_amount ?? 0),
      label: depositItem?.payment_label ?? (order.payment_mode === "INSTALLMENT" ? "First deposit" : "Full order"),
      helper: "This bank invoice will be submitted for admin approval.",
    };
  }, [action, order, selectedInstallment]);

  const handleBankTransfer = async () => {
    if (!order) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setProcessing(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`${API_URL}/payment/manual/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          installment_id: action === "installment" ? installmentId : null,
        }),
      });
      const data = await res.json();

      if (data.reference) {
        setBankDetails(data);
        setNotice("Invoice created. Use these details for transfer; the payment is now awaiting admin approval.");
        return;
      }

      setError(data.message || "Could not create bank transfer invoice.");
    } catch {
      setError("Connection error while creating bank transfer invoice.");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#07070a] text-white relative overflow-x-hidden pb-20">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-blue-700/8 blur-[180px]" />
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full bg-purple-700/10 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28">
        <Link href="/orders">
          <motion.span whileHover={{ x: -4 }} className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </motion.span>
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Bank Checkout</span>
          </h1>
          <p className="text-white/50">Review the order, confirm the selected invoice, and submit it for admin approval.</p>
        </motion.div>

        <AnimatePresence>
          {notice && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium">
              {notice}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {loadingOrder ? (
          <div className="flex justify-center py-32"><Spinner /></div>
        ) : order ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Order summary</h2>
                  <p className="font-mono text-xs text-white/40 break-all mt-1">Order {order.id}</p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65">
                  {order.payment_mode}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                {(order.order_items ?? []).map((item, index) => (
                  <div key={item.id ?? `${order.id}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{getItemName(item)}</p>
                      <p className="text-xs text-white/45 mt-1">Qty {item.quantity ?? 1}</p>
                    </div>
                    <p className="text-sm font-bold text-white tabular-nums">{fmtMoney(item.amount ?? item.price)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryPill label="Total" value={fmtMoney(order.total_amount)} />
                <SummaryPill label="Paid" value={fmtMoney(order.paid_amount)} />
                <SummaryPill label="Remaining" value={fmtMoney(order.remaining_balance)} />
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-2 rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6 shadow-2xl h-fit"
            >
              <h2 className="text-xl font-bold mb-5">Bank invoice</h2>

              <div className="space-y-3 mb-5">
                <SummaryPill label="Invoice type" value={paymentSummary.title} />
                <SummaryPill label="Month payment" value={paymentSummary.label} />
                <SummaryPill label="Invoice amount" value={fmtMoney(paymentSummary.amount)} highlight />
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 mb-5">
                <p className="text-yellow-300 text-sm font-semibold">Admin approval required</p>
                <p className="text-yellow-100/70 text-xs mt-1 leading-relaxed">{paymentSummary.helper}</p>
              </div>

              {!bankDetails ? (
                <motion.button
                  onClick={handleBankTransfer}
                  disabled={processing}
                  whileHover={{ scale: processing ? 1 : 1.02, y: processing ? 0 : -2 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processing ? <><Spinner sm /> Creating invoice...</> : "Create bank invoice"}
                </motion.button>
              ) : (
                <div className="space-y-4">
                  <BankDetailRow label="Bank Name" value={bankDetails.bank_name} onCopy={() => copyToClipboard(bankDetails.bank_name, "bank")} copied={copied === "bank"} />
                  <BankDetailRow label="Account Name" value={bankDetails.account_name} onCopy={() => copyToClipboard(bankDetails.account_name, "name")} copied={copied === "name"} />
                  <BankDetailRow label="Account Number" value={bankDetails.account_number} onCopy={() => copyToClipboard(bankDetails.account_number, "number")} copied={copied === "number"} />
                  <BankDetailRow label="Amount" value={fmtMoney(bankDetails.amount)} onCopy={() => copyToClipboard(String(bankDetails.amount), "amount")} copied={copied === "amount"} />
                  <BankDetailRow label="Invoice Reference" value={bankDetails.reference} onCopy={() => copyToClipboard(bankDetails.reference, "ref")} copied={copied === "ref"} highlight />

                  <div className="p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
                    <p className="text-blue-200 text-sm font-medium">Use the invoice reference as your transfer narration.</p>
                    <p className="text-blue-100/65 text-xs mt-1 leading-relaxed">
                      After transfer, admin will review and approve the payment. Approved month payments will mark that month as paid.
                    </p>
                  </div>

                  <Link
                    href="/orders"
                    className="flex w-full justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 font-bold text-white"
                  >
                    Return to Orders
                  </Link>
                </div>
              )}
            </motion.aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

function SummaryPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-blue-500/25 bg-blue-500/10" : "border-white/8 bg-white/5"}`}>
      <p className="text-white/45 text-xs mb-1">{label}</p>
      <p className={`font-bold tabular-nums break-words ${highlight ? "text-blue-200" : "text-white"}`}>{value}</p>
    </div>
  );
}

interface BankRowProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  highlight?: boolean;
}

function BankDetailRow({ label, value, onCopy, copied, highlight }: BankRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${highlight ? "border-blue-500/30 bg-blue-500/8" : "border-white/8 bg-white/4"}`}>
      <div className="min-w-0">
        <p className="text-white/50 text-xs mb-0.5">{label}</p>
        <p className={`font-semibold break-all ${highlight ? "text-blue-300" : "text-white"}`}>{value}</p>
      </div>
      <motion.button
        type="button"
        onClick={onCopy}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`shrink-0 p-2 rounded-xl transition-colors ${copied ? "bg-green-500/20 text-green-400" : "bg-white/8 text-white/60 hover:text-white"}`}
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        )}
      </motion.button>
    </div>
  );
}
