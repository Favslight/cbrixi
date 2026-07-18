'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ReceiptActionButtons } from '@/components/receipts/ReceiptActionButtons';
import {
  listMyOrderReceipts,
  receiptAmountPaid,
  receiptRemainingBalance,
  ReceiptApiError,
  type Receipt,
} from '@/lib/receipts';
import { formatMoney } from '@/lib/pricing';

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrderPaymentHistory({ orderId }: { orderId: string }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listMyOrderReceipts(orderId, { page: 1, limit: 50 });
      setReceipts(result.receipts);
    } catch (err) {
      if (err instanceof ReceiptApiError && err.status === 404) {
        setReceipts([]);
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load payment history.');
        setReceipts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold">Payment history</h3>
        <button
          type="button"
          onClick={() => load()}
          className="text-[11px] text-white/45 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {actionError ? (
        <p className="mb-3 text-xs text-red-300">{actionError}</p>
      ) : null}

      {loading ? (
        <p className="text-white/35 text-sm">Loading receipts…</p>
      ) : error ? (
        <p className="text-red-300 text-sm">{error}</p>
      ) : receipts.length === 0 ? (
        <p className="text-white/35 text-sm">
          No receipts yet. Receipts appear after a payment is approved.
        </p>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div
              key={receipt.receipt_number}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/receipts/${encodeURIComponent(receipt.receipt_number)}`}
                    className="text-sm font-semibold text-blue-200 hover:text-blue-100 font-mono break-all"
                  >
                    {receipt.receipt_number}
                  </Link>
                  <p className="text-xs text-white/45 mt-1">
                    {fmtDate(receipt.issued_at ?? receipt.created_at)}
                    {receipt.payment_method ? ` · ${receipt.payment_method}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-emerald-300 font-semibold tabular-nums">
                      Paid {formatMoney(receiptAmountPaid(receipt))}
                    </span>
                    {receiptRemainingBalance(receipt) != null ? (
                      <span className="text-white/50 tabular-nums">
                        Remaining {formatMoney(receiptRemainingBalance(receipt))}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ReceiptActionButtons
                  receiptNumber={receipt.receipt_number}
                  receipt={receipt}
                  role="customer"
                  viewHref={`/receipts/${encodeURIComponent(receipt.receipt_number)}`}
                  onError={setActionError}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
