'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  downloadAdminReceiptPdf,
  extractReceipt,
  printAdminReceipt,
  resendAdminReceipt,
  resolveAdminReceiptForPayment,
  ReceiptApiError,
  type Receipt,
} from '@/lib/receipts';

type Busy = 'view' | 'pdf' | 'print' | 'resend' | null;

export function AdminPaymentReceiptActions({
  paymentId,
  receiptNumber: initialReceiptNumber,
  receipt: initialReceipt,
  mobile,
  onError,
  onMessage,
}: {
  paymentId: string;
  receiptNumber?: string | null;
  receipt?: Receipt | null;
  mobile?: boolean;
  onError?: (message: string) => void;
  onMessage?: (message: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [cached, setCached] = useState<Receipt | null>(() =>
    initialReceipt && initialReceipt.receipt_number
      ? initialReceipt
      : initialReceiptNumber
        ? { receipt_number: initialReceiptNumber }
        : null
  );

  const btn = mobile
    ? 'w-full py-2.5 rounded-xl text-xs font-semibold'
    : 'px-3 py-1.5 rounded-lg text-[11px] font-semibold';

  const resolve = async (): Promise<Receipt> => {
    if (cached?.receipt_number) {
      // Prefer full resolve when we only have a number from approve response
      if (cached.items || cached.company || cached.amount_paid != null) return cached;
      try {
        const full = await resolveAdminReceiptForPayment({
          id: paymentId,
          receipt_number: cached.receipt_number,
          receipt: cached,
        });
        setCached(full);
        return full;
      } catch {
        return cached;
      }
    }
    const receipt = await resolveAdminReceiptForPayment({
      id: paymentId,
      receipt_number: initialReceiptNumber,
      receipt: initialReceipt ?? undefined,
    });
    setCached(receipt);
    return receipt;
  };

  const run = async (action: Exclude<Busy, null>, fn: () => Promise<void>) => {
    setBusy(action);
    try {
      await fn();
    } catch (err) {
      const message =
        err instanceof ReceiptApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Receipt action failed.';
      onError?.(message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`flex ${mobile ? 'grid grid-cols-2' : 'flex-wrap justify-end'} gap-2`}>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          run('view', async () => {
            const receipt = await resolve();
            router.push(`/admin/receipts/${encodeURIComponent(receipt.receipt_number)}`);
          })
        }
        className={`${btn} border border-blue-500/25 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 disabled:opacity-40`}
      >
        {busy === 'view' ? 'Loading…' : 'View Receipt'}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          run('pdf', async () => {
            const receipt = await resolve();
            await downloadAdminReceiptPdf(receipt);
          })
        }
        className={`${btn} border border-white/10 bg-white/5 text-white/75 hover:text-white hover:bg-white/10 disabled:opacity-40`}
      >
        {busy === 'pdf' ? 'Downloading…' : 'Download PDF'}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          run('print', async () => {
            const receipt = await resolve();
            await printAdminReceipt(receipt);
          })
        }
        className={`${btn} border border-white/10 bg-white/5 text-white/75 hover:text-white hover:bg-white/10 disabled:opacity-40`}
      >
        {busy === 'print' ? 'Opening…' : 'Print'}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          run('resend', async () => {
            const receipt = await resolve();
            const msg = await resendAdminReceipt(receipt.receipt_number);
            onMessage?.(msg);
          })
        }
        className={`${btn} ${mobile ? 'col-span-2' : ''} border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40`}
      >
        {busy === 'resend' ? 'Sending…' : 'Resend Receipt'}
      </button>
    </div>
  );
}

/** Capture receipt from approve API response for later use on the same page. */
export function receiptFromApproveResponse(data: unknown): Receipt | null {
  return extractReceipt(data);
}
