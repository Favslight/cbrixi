'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  downloadAdminReceiptPdf,
  downloadMyReceiptPdf,
  printAdminReceipt,
  printMyReceipt,
  resendAdminReceipt,
  ReceiptApiError,
  type Receipt,
} from '@/lib/receipts';

type Role = 'customer' | 'admin';

type BusyAction = 'view' | 'pdf' | 'print' | 'resend' | null;

export function ReceiptActionButtons({
  receiptNumber,
  receipt,
  role,
  viewHref,
  showResend = false,
  size = 'sm',
  className = '',
  onError,
  onMessage,
}: {
  receiptNumber: string;
  /** When provided, Print/PDF use this object (no extra fetch). */
  receipt?: Receipt | null;
  role: Role;
  viewHref?: string;
  showResend?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onError?: (message: string) => void;
  onMessage?: (message: string) => void;
}) {
  const [busy, setBusy] = useState<BusyAction>(null);

  const btn =
    size === 'md'
      ? 'px-3 py-2 rounded-xl text-xs font-semibold'
      : 'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold';

  const source = receipt?.receipt_number ? receipt : receiptNumber;

  const run = async (action: Exclude<BusyAction, null>, fn: () => Promise<void>) => {
    setBusy(action);
    try {
      await fn();
    } catch (err) {
      const message =
        err instanceof ReceiptApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Something went wrong.';
      onError?.(message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {viewHref ? (
        <Link
          href={viewHref}
          className={`${btn} border border-blue-500/25 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20`}
        >
          View
        </Link>
      ) : null}
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          run('pdf', async () => {
            if (role === 'admin') await downloadAdminReceiptPdf(source);
            else await downloadMyReceiptPdf(source);
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
            if (role === 'admin') await printAdminReceipt(source);
            else await printMyReceipt(source);
          })
        }
        className={`${btn} border border-white/10 bg-white/5 text-white/75 hover:text-white hover:bg-white/10 disabled:opacity-40`}
      >
        {busy === 'print' ? 'Opening…' : 'Print'}
      </button>
      {showResend && role === 'admin' ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run('resend', async () => {
              const msg = await resendAdminReceipt(receiptNumber);
              onMessage?.(msg);
            })
          }
          className={`${btn} border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40`}
        >
          {busy === 'resend' ? 'Sending…' : 'Resend'}
        </button>
      ) : null}
    </div>
  );
}
