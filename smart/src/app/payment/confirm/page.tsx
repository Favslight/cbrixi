"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import {
  buildPaymentQuery,
  buildPaymentSummary,
  fmtPaymentMoney,
  type PaymentAction,
  type PaymentOrderSummary,
} from "@/lib/paymentFlow";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

const Spinner = ({ sm }: { sm?: boolean }) => (
  <svg className={`animate-spin text-white ${sm ? "w-4 h-4" : "w-8 h-8"}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

function PaymentConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();

  const orderId = params.get("order_id") || "";
  const installmentId = params.get("installment_id");
  const action = (params.get("action") || "order") as PaymentAction;
  const routeLabel = params.get("label");

  const [order, setOrder] = useState<PaymentOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmedIntent, setConfirmedIntent] = useState(false);

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

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const orders: PaymentOrderSummary[] = Array.isArray(data) ? data : data.orders ?? data.data ?? [];
      if (!res.ok) {
        setError(data.message || "Failed to load order.");
        return;
      }
      const found = orders.find((candidate) => candidate.id === orderId);
      if (!found) {
        setError("Order not found.");
        return;
      }
      setOrder(found);
    } catch {
      setError("Connection error while loading order.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder().catch(() => undefined);
  }, [fetchOrder]);

  const paymentSummary = useMemo(
    () => buildPaymentSummary(order, action, installmentId, routeLabel),
    [action, installmentId, order, routeLabel]
  );

  const proceedToPayment = () => {
    const query = buildPaymentQuery({
      orderId,
      mode: order?.payment_mode,
      action,
      installmentId,
      label: routeLabel ?? undefined,
    });
    router.push(`/payment?${query}&confirmed=1`);
  };

  return (
    <main className="min-h-screen bg-[#07070a] text-white relative overflow-x-hidden pb-20">
      <Navbar />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28">
        <Link href="/orders">
          <motion.span whileHover={{ x: -4 }} className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </motion.span>
        </Link>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Confirm Payment
            </span>
          </h1>
          <p className="text-white/50 text-sm">
            Review the amount below and confirm you intend to make this bank transfer before continuing.
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner /></div>
        ) : order ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoBlock label="Payment type" value={paymentSummary.title} />
              <InfoBlock label="Payment label" value={paymentSummary.label} />
              <InfoBlock label="Order total" value={fmtPaymentMoney(order.total_amount)} />
              <InfoBlock label="Amount to pay now" value={fmtPaymentMoney(paymentSummary.amount)} highlight />
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 text-sm text-yellow-100/80 leading-relaxed">
              On the next screen you will receive a payment invoice with a unique reference to use as your transfer
              narration. Admin is notified only after you confirm you have completed the transfer.
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmedIntent}
                onChange={(e) => setConfirmedIntent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500"
              />
              <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                I confirm I want to proceed with a bank transfer of{" "}
                <strong className="text-white">{fmtPaymentMoney(paymentSummary.amount)}</strong> for this order.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={proceedToPayment}
                disabled={!confirmedIntent}
                className="flex-1 py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to bank transfer
              </button>
              <Link
                href="/orders"
                className="flex-1 py-4 rounded-2xl font-semibold text-center border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </motion.section>
        ) : null}
      </div>
    </main>
  );
}

export default function PaymentConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PaymentConfirmContent />
    </Suspense>
  );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-blue-500/25 bg-blue-500/10" : "border-white/8 bg-white/5"}`}>
      <p className="text-white/45 text-xs mb-1">{label}</p>
      <p className={`font-bold tabular-nums ${highlight ? "text-blue-200 text-xl" : "text-white"}`}>{value}</p>
    </div>
  );
}
