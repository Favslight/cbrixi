'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import ReceiptDetailView from '@/components/receipts/ReceiptDetailView';
import { ReceiptActionButtons } from '@/components/receipts/ReceiptActionButtons';
import { getMyReceipt, ReceiptApiError, type Receipt } from '@/lib/receipts';

export default function CustomerReceiptPage() {
  const router = useRouter();
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

  const load = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    if (!receiptNumber) {
      setError('Invalid receipt number.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getMyReceipt(receiptNumber);
      setReceipt(data);
    } catch (err) {
      setReceipt(null);
      if (err instanceof ReceiptApiError) {
        setError(
          err.status === 404
            ? 'Receipt not found.'
            : err.status === 403
              ? 'You do not have access to this receipt.'
              : err.message
        );
      } else {
        setError('Failed to load receipt.');
      }
    } finally {
      setLoading(false);
    }
  }, [receiptNumber, router]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-28 px-4 pb-20">
        <Link href="/orders" className="text-sm text-white/45 hover:text-white">
          &lt;- Back to orders
        </Link>

        <div className="mt-6">
          {loading ? (
            <div className="py-16 text-center text-white/45">Loading receipt…</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-red-200 text-sm">
              {error}
            </div>
          ) : receipt ? (
            <>
              {actionError ? (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                  {actionError}
                </div>
              ) : null}
              <ReceiptDetailView
                receipt={receipt}
                actions={
                  <ReceiptActionButtons
                    receiptNumber={receipt.receipt_number}
                    receipt={receipt}
                    role="customer"
                    size="md"
                    onError={setActionError}
                  />
                }
              />
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
