"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import {
  buildPaymentQuery,
  buildPaymentSummary,
  confirmManualPayment,
  fmtPaymentMoney,
  initiateManualInvoice,
  type ManualInvoice,
  type PaymentAction,
  type PaymentOrderSummary,
} from "@/lib/paymentFlow";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

interface OrderLine {
  id?: string;
  name?: string;
  product_name?: string;
  quantity?: number;
  price?: string | number;
  amount?: string | number;
}

const Spinner = ({ sm }: { sm?: boolean }) => (
  <svg className={`animate-spin text-white ${sm ? "w-4 h-4" : "w-8 h-8"}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

function getItemName(item: OrderLine) {
  return item.name ?? item.product_name ?? "Product";
}

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();

  const orderId = params.get("order_id") || "";
  const installmentId = params.get("installment_id") || null;
  const action = (params.get("action") || "order") as PaymentAction;
  const routeLabel = params.get("label");
  const confirmed = params.get("confirmed") === "1";

  const [order, setOrder] = useState<(PaymentOrderSummary & { order_items?: OrderLine[] }) | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [invoice, setInvoice] = useState<ManualInvoice | null>(null);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmed && orderId) {
      const query = buildPaymentQuery({
        orderId,
        mode: params.get("mode") ?? undefined,
        action,
        installmentId,
        label: routeLabel ?? undefined,
      });
      router.replace(`/payment/confirm?${query}`);
    }
  }, [action, confirmed, installmentId, orderId, params, routeLabel, router]);

  const createInvoice = useCallback(
    async (orderData: PaymentOrderSummary) => {
      const token = localStorage.getItem("userToken");
      if (!token) return;

      setLoadingInvoice(true);
      setError("");
      const result = await initiateManualInvoice(token, {
        order_id: orderData.id,
        installment_id: action === "installment" ? installmentId : null,
      });
      setLoadingInvoice(false);

      if (result.success && result.invoice) {
        setInvoice(result.invoice);
      } else {
        setError(result.error || "Could not generate payment invoice.");
      }
    },
    [action, installmentId]
  );

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
      const orders = Array.isArray(data) ? data : data.orders ?? data.data ?? [];

      if (!res.ok) {
        setError(data.message || "Failed to load order.");
        return;
      }

      const foundOrder = orders.find((candidate: { id: string }) => candidate.id === orderId);
      if (!foundOrder) {
        setError("Order not found.");
        return;
      }

      setOrder(foundOrder);
      await createInvoice(foundOrder);
    } catch {
      setError("Connection error while loading order.");
    } finally {
      setLoadingOrder(false);
    }
  }, [createInvoice, orderId, router]);

  useEffect(() => {
    if (confirmed) {
      fetchOrder().catch(() => undefined);
    }
  }, [confirmed, fetchOrder]);

  const paymentSummary = useMemo(
    () => buildPaymentSummary(order, action, installmentId, routeLabel),
    [action, installmentId, order, routeLabel]
  );

  const handleSubmitPayment = async () => {
    if (!order || !transferConfirmed || !invoice) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setProcessing(true);
    setError("");
    setNotice("");

    const result = await confirmManualPayment(token, {
      reference: invoice.reference,
      order_id: order.id,
      installment_id: action === "installment" ? installmentId : null,
    });

    setProcessing(false);

    if (result.success) {
      setSubmitted(true);
      setNotice("Payment submitted for admin review. Keep your transfer reference safe.");
    } else {
      setError(result.error || "Could not submit payment for review.");
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!confirmed) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isLoading = loadingOrder || loadingInvoice;

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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Bank Transfer</span>
          </h1>
          <p className="text-white/50">Use the invoice reference as your transfer narration, then confirm after paying.</p>
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
              {order && !invoice && (
                <button
                  type="button"
                  onClick={() => createInvoice(order)}
                  className="mt-3 block text-sm font-semibold text-red-200 underline"
                >
                  Retry invoice generation
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Spinner />
            <p className="text-white/40 text-sm">{loadingInvoice ? "Generating invoice..." : "Loading order..."}</p>
          </div>
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
                    <p className="text-sm font-bold text-white tabular-nums">{fmtPaymentMoney(item.amount ?? item.price)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryPill label="Total" value={fmtPaymentMoney(order.total_amount)} />
                <SummaryPill label="Paid" value={fmtPaymentMoney(order.paid_amount)} />
                <SummaryPill label="Remaining" value={fmtPaymentMoney(order.remaining_balance)} />
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-2 rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6 shadow-2xl h-fit"
            >
              <h2 className="text-xl font-bold mb-5">Payment invoice</h2>

              <div className="space-y-3 mb-5">
                <SummaryPill label="Invoice type" value={paymentSummary.title} />
                <SummaryPill label="Payment label" value={paymentSummary.label} />
                <SummaryPill label="Amount to transfer" value={fmtPaymentMoney(invoice?.amount ?? paymentSummary.amount)} highlight />
              </div>

              {!submitted ? (
                <>
                  {invoice ? (
                    <div className="space-y-3 mb-5">
                      <BankDetailRow label="Invoice Reference (narration)" value={invoice.reference} onCopy={() => copyToClipboard(invoice.reference, "ref")} copied={copied === "ref"} highlight />
                      <BankDetailRow label="Bank Name" value={invoice.bank_name} onCopy={() => copyToClipboard(invoice.bank_name, "bank")} copied={copied === "bank"} />
                      <BankDetailRow label="Account Name" value={invoice.account_name} onCopy={() => copyToClipboard(invoice.account_name, "name")} copied={copied === "name"} />
                      <BankDetailRow label="Account Number" value={invoice.account_number} onCopy={() => copyToClipboard(invoice.account_number, "number")} copied={copied === "number"} />
                      <BankDetailRow label="Amount" value={fmtPaymentMoney(invoice.amount)} onCopy={() => copyToClipboard(String(invoice.amount), "amount")} copied={copied === "amount"} highlight />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 mb-5 text-sm text-yellow-100/75">
                      Invoice could not be loaded. Please retry or contact support.
                    </div>
                  )}

                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4 mb-5">
                    <p className="text-blue-200 text-sm font-medium">Transfer instructions</p>
                    <p className="text-blue-100/65 text-xs mt-1 leading-relaxed">
                      Copy the <strong className="text-blue-100">invoice reference</strong> above and paste it as your
                      bank transfer narration. Transfer the exact amount, then confirm below.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer mb-5">
                    <input
                      type="checkbox"
                      checked={transferConfirmed}
                      onChange={(e) => setTransferConfirmed(e.target.checked)}
                      disabled={!invoice}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-white/70">
                      I have transferred <strong className="text-white">{fmtPaymentMoney(invoice?.amount ?? paymentSummary.amount)}</strong> using
                      reference <strong className="text-white font-mono">{invoice?.reference ?? "—"}</strong>.
                    </span>
                  </label>

                  <motion.button
                    onClick={handleSubmitPayment}
                    disabled={processing || !transferConfirmed || !invoice}
                    whileHover={{ scale: processing || !transferConfirmed ? 1 : 1.02, y: processing || !transferConfirmed ? 0 : -2 }}
                    whileTap={{ scale: processing || !transferConfirmed ? 1 : 0.98 }}
                    className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {processing ? <><Spinner sm /> Submitting...</> : "I have made payment"}
                  </motion.button>
                </>
              ) : (
                <div className="space-y-4">
                  {invoice && (
                    <BankDetailRow label="Invoice Reference" value={invoice.reference} onCopy={() => copyToClipboard(invoice.reference, "ref")} copied={copied === "ref"} highlight />
                  )}
                  <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                    <p className="text-emerald-200 text-sm font-medium">Submitted for admin review</p>
                    <p className="text-emerald-100/65 text-xs mt-1 leading-relaxed">
                      Admin will verify your bank transfer and approve the payment. You can track status from your orders page.
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
