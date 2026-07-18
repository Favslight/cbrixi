'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReceiptDetailView from '@/components/receipts/ReceiptDetailView';
import { ReceiptActionButtons } from '@/components/receipts/ReceiptActionButtons';
import { getAdminReceipt, ReceiptApiError, type Receipt } from '@/lib/receipts';

export default function AdminReceiptDetailPage() {
  const params = useParams();
  const raw = params?.receiptNumber;
  const receiptNumber =
    typeof raw === 'string'
      ? decodeURIComponent(raw)
      : Array.isArray(raw)
        ? decodeURIComponent(raw[0] ?? '')
        : '';

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const load = useCallback(async () => {
    if (!receiptNumber) {
      setError('Invalid receipt number.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getAdminReceipt(receiptNumber);
      setReceipt(data);
    } catch (err) {
      setReceipt(null);
      if (err instanceof ReceiptApiError) {
        setError(
          err.status === 404
            ? 'Receipt not found.'
            : err.status === 403
              ? 'Access denied.'
              : err.message
        );
      } else {
        setError('Failed to load receipt.');
      }
    } finally {
      setLoading(false);
    }
  }, [receiptNumber]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-4xl">
      <Link href="/admin/receipts" className="text-sm text-white/45 hover:text-white">
        &lt;- Back to receipts
      </Link>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin text-blue-500 w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-red-200 text-sm">
            {error}
          </div>
        ) : receipt ? (
          <>
            {(actionError || actionMessage) && (
              <div
                className={`mb-4 rounded-xl border p-3 text-sm ${
                  actionError
                    ? 'border-red-500/25 bg-red-500/10 text-red-300'
                    : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {actionError || actionMessage}
              </div>
            )}
            <ReceiptDetailView
              receipt={receipt}
              actions={
                <ReceiptActionButtons
                  receiptNumber={receipt.receipt_number}
                  receipt={receipt}
                  role="admin"
                  showResend
                  size="md"
                  onError={(msg) => {
                    setActionMessage('');
                    setActionError(msg);
                  }}
                  onMessage={(msg) => {
                    setActionError('');
                    setActionMessage(msg);
                  }}
                />
              }
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
