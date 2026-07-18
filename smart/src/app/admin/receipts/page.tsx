'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ReceiptActionButtons } from '@/components/receipts/ReceiptActionButtons';
import {
  listAdminReceipts,
  receiptAmountPaid,
  receiptRemainingBalance,
  ReceiptApiError,
  type Receipt,
} from '@/lib/receipts';
import { formatMoney } from '@/lib/pricing';

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [orderFilter, setOrderFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [appliedOrder, setAppliedOrder] = useState('');
  const [appliedPayment, setAppliedPayment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAdminReceipts({
        page,
        limit: 20,
        order_id: appliedOrder || undefined,
        payment_id: appliedPayment || undefined,
      });
      setReceipts(result.receipts);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch (err) {
      setReceipts([]);
      setError(err instanceof ReceiptApiError ? err.message : 'Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  }, [page, appliedOrder, appliedPayment]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const applyFilters = () => {
    setPage(1);
    setAppliedOrder(orderFilter.trim());
    setAppliedPayment(paymentFilter.trim());
  };

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Receipts</h1>
          {total > 0 && (
            <span className="w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {total} records
            </span>
          )}
        </div>
        <p className="text-white/40 text-sm leading-relaxed">
          Official receipts for successful payments. Partial payments create separate receipts per payment.
        </p>
      </motion.div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="flex-1 min-w-0">
          <span className="block text-xs text-white/40 mb-1.5">Order ID</span>
          <input
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            placeholder="Filter by order_id"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
        <label className="flex-1 min-w-0">
          <span className="block text-xs text-white/40 mb-1.5">Payment ID</span>
          <input
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            placeholder="Filter by payment_id"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/25"
        >
          Apply filters
        </button>
      </div>

      <AnimatePresence>
        {(error || actionError || actionMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl text-sm border ${
              error || actionError
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            {error || actionError || actionMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin text-blue-500 w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/8 bg-white/2">
          <p className="text-white font-semibold text-lg mb-1">No receipts found.</p>
          <p className="text-white/40 text-sm">Receipts are created when payments are approved as SUCCESS.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {receipts.map((receipt) => (
              <div key={receipt.receipt_number} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
                <Link
                  href={`/admin/receipts/${encodeURIComponent(receipt.receipt_number)}`}
                  className="font-mono text-sm text-blue-200 break-all hover:text-blue-100"
                >
                  {receipt.receipt_number}
                </Link>
                <p className="text-emerald-300 font-bold tabular-nums">{formatMoney(receiptAmountPaid(receipt))}</p>
                <p className="text-white/45 text-xs">
                  Remaining {formatMoney(receiptRemainingBalance(receipt) ?? 0)} · {fmtDate(receipt.issued_at ?? receipt.created_at)}
                </p>
                <p className="text-white/35 text-xs font-mono break-all">Order {receipt.order_id}</p>
                <ReceiptActionButtons
                  receiptNumber={receipt.receipt_number}
                  receipt={receipt}
                  role="admin"
                  showResend
                  viewHref={`/admin/receipts/${encodeURIComponent(receipt.receipt_number)}`}
                  onError={(msg) => {
                    setActionMessage('');
                    setActionError(msg);
                  }}
                  onMessage={(msg) => {
                    setActionError('');
                    setActionMessage(msg);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="hidden lg:block rounded-2xl border border-white/8 overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="text-left px-5 py-3.5 text-white/40 font-medium">Receipt</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Order</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Amount paid</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Remaining</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Issued</th>
                  <th className="px-4 py-3.5 text-right text-white/40 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.receipt_number} className="border-b border-white/5 hover:bg-white/3 align-top">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/receipts/${encodeURIComponent(receipt.receipt_number)}`}
                        className="font-mono text-blue-200 hover:text-blue-100 break-all"
                      >
                        {receipt.receipt_number}
                      </Link>
                      {receipt.customer_email || receipt.email ? (
                        <p className="text-white/40 text-xs mt-1 break-all">{receipt.customer_email || receipt.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-white/55 break-all">{receipt.order_id}</td>
                    <td className="px-4 py-4 text-white font-bold tabular-nums">{formatMoney(receiptAmountPaid(receipt))}</td>
                    <td className="px-4 py-4 text-white/60 tabular-nums">
                      {receiptRemainingBalance(receipt) != null
                        ? formatMoney(receiptRemainingBalance(receipt))
                        : '—'}
                    </td>
                    <td className="px-4 py-4 text-white/50 text-xs">{fmtDate(receipt.issued_at ?? receipt.created_at)}</td>
                    <td className="px-4 py-4 text-right">
                      <ReceiptActionButtons
                        receiptNumber={receipt.receipt_number}
                        receipt={receipt}
                        role="admin"
                        showResend
                        viewHref={`/admin/receipts/${encodeURIComponent(receipt.receipt_number)}`}
                        className="justify-end"
                        onError={(msg) => {
                          setActionMessage('');
                          setActionError(msg);
                        }}
                        onMessage={(msg) => {
                          setActionError('');
                          setActionMessage(msg);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 disabled:opacity-40 hover:bg-white/5"
              >
                Previous
              </button>
              <span className="text-sm text-white/45">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
