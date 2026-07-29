'use client';

import type { ReactNode } from 'react';
import {
  receiptAmountPaid,
  receiptItemLabel,
  receiptItemTotal,
  receiptRemainingBalance,
  type Receipt,
} from '@/lib/receipts';
import { formatMoney } from '@/lib/pricing';

/** Same asset as browser tab icon (`layout.tsx` metadata → `/favicon.png`). */
const RECEIPT_LOGO = '/favicon.png';

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

export default function ReceiptDetailView({
  receipt,
  actions,
}: {
  receipt: Receipt;
  actions?: ReactNode;
}) {
  const company = receipt.company;
  const items = receipt.items ?? [];
  const amountPaid = receiptAmountPaid(receipt);
  const remaining = receiptRemainingBalance(receipt);
  const orderTotal = receipt.total_amount ?? receipt.order_total ?? receipt.order?.total_amount;
  const issued = receipt.issued_at ?? receipt.payment_date ?? receipt.created_at;
  const companyName = company?.name || company?.legal_name || 'CBRIXI';
  const companyEmail = company?.email || company?.support_email;
  const customerEmail = receipt.customer_email || receipt.email;
  const customerPhone = receipt.customer_phone || receipt.phone;
  const customDetails = (receipt.custom_details ?? []).filter(
    (detail) => detail.key.trim() || detail.value.trim()
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Blue brand header — favicon logo forced white for contrast; colors survive print */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-5 sm:px-7 sm:py-6 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={RECEIPT_LOGO}
              alt={companyName}
              className="h-9 sm:h-10 w-auto max-w-[48px] object-contain shrink-0 [filter:brightness(0)_invert(1)] [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
            />
            <div className="min-w-0 pt-0.5">
              <p className="text-lg sm:text-xl font-bold tracking-[0.18em] text-white uppercase">
                {companyName}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/70 font-semibold">
                Receipt
              </p>
              <h1 className="mt-1 text-lg sm:text-xl font-bold text-white font-mono break-all">
                {receipt.receipt_number}
              </h1>
              {receipt.invoice_number ? (
                <p className="mt-1.5 text-sm text-white/90 font-mono break-all">
                  Invoice {receipt.invoice_number}
                </p>
              ) : null}
              <p className="text-white/65 text-sm mt-1">Issued {fmtDate(issued)}</p>
            </div>
          </div>
          {actions ? <div className="shrink-0 receipt-no-print">{actions}</div> : null}
        </div>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Company</h2>
          <p className="text-white font-semibold">{companyName}</p>
          {company?.tagline ? <p className="text-white/50 text-sm mt-0.5">{company.tagline}</p> : null}
          {company?.address ? <p className="text-white/55 text-sm mt-1 whitespace-pre-line">{company.address}</p> : null}
          {companyEmail ? <p className="text-white/45 text-sm mt-1 break-all">{companyEmail}</p> : null}
          {company?.phone ? <p className="text-white/45 text-sm mt-1">{company.phone}</p> : null}
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Customer</h2>
          {receipt.customer_name ? (
            <p className="text-white font-semibold">{receipt.customer_name}</p>
          ) : null}
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-white/40 shrink-0">Email</dt>
              <dd className="text-white/70 break-all min-w-0">
                {customerEmail || '—'}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-white/40 shrink-0">Phone</dt>
              <dd className="text-white/70 break-all min-w-0">
                {customerPhone || '—'}
              </dd>
            </div>
            {receipt.invoice_number ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-white/40 shrink-0">Invoice</dt>
                <dd className="text-white/70 font-mono break-all min-w-0">
                  {receipt.invoice_number}
                </dd>
              </div>
            ) : null}
          </dl>
          {(receipt.payment_reference || receipt.reference || receipt.payment?.reference) && (
            <p className="text-white/45 text-xs mt-2 break-all">
              Ref: {receipt.payment_reference || receipt.reference || receipt.payment?.reference}
            </p>
          )}
          {(receipt.payment_method || receipt.payment?.payment_method) && (
            <p className="text-white/45 text-xs mt-1">
              Method: {receipt.payment_method || receipt.payment?.payment_method}
            </p>
          )}
        </section>
      </div>

      <div className="px-5 sm:px-7 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Metric label="Amount paid" value={formatMoney(amountPaid)} emphasize />
          <Metric label="Order total" value={orderTotal != null ? formatMoney(orderTotal) : '—'} />
          <Metric
            label="Remaining balance"
            value={remaining != null ? formatMoney(remaining) : '—'}
          />
        </div>
      </div>

      <div className="px-5 sm:px-7 pb-7">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Items</h2>
        {items.length === 0 ? (
          <p className="text-white/40 text-sm">No line items on this receipt.</p>
        ) : (
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03] text-left text-white/40">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id ?? `${receiptItemLabel(item)}-${index}`} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{receiptItemLabel(item)}</p>
                      {item.variant_name ? (
                        <p className="text-white/40 text-xs mt-0.5">{item.variant_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70 tabular-nums">{item.quantity ?? 1}</td>
                    <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                      {formatMoney(receiptItemTotal(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {customDetails.length > 0 ? (
        <div className="px-5 sm:px-7 pb-7">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Details</h2>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <dl className="divide-y divide-white/5">
              {customDetails.map((detail, index) => (
                <div key={`${detail.key}-${index}`} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 px-4 py-3 bg-white/[0.015]">
                  <dt className="text-white/40 text-sm font-medium break-words">{detail.key || 'Detail'}</dt>
                  <dd className="text-white/75 text-sm whitespace-pre-line break-words">{detail.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
      <p className="text-white/40 text-[11px] mb-1">{label}</p>
      <p className={`font-bold tabular-nums ${emphasize ? 'text-emerald-300 text-lg' : 'text-white text-base'}`}>
        {value}
      </p>
    </div>
  );
}
