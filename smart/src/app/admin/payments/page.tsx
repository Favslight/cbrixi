'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type AdminOrderDisplaySource,
  type AdminOrderItemDisplay,
  type AdminPaymentOrderDisplaySource,
  displayName,
  itemLabel,
  itemLineTotal,
  itemUnitPrice,
  orderItems,
  orderSummary,
  productsText,
  shortId,
  totalQuantity,
  variantsText,
} from '@/lib/adminOrderDisplay';
import { formatMoney } from '@/lib/pricing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

type PaymentTab = 'pending' | 'approved' | 'rejected';

interface AdminPayment extends AdminPaymentOrderDisplaySource {
  id: string;
  reference?: string | null;
  amount: string | number;
  email?: string | null;
  payment_method: string;
  payment_mode?: string;
  payment_type?: string;
  payment_label?: string;
  total_amount?: string | number;
  deposit_amount?: string | number | null;
  paid_amount?: string | number;
  remaining_balance?: string | number;
  external_email?: string | null;
  status: string;
  order_status?: string;
  order_id: string;
  installment_id?: string | null;
  installment_number?: number | null;
  installment_due_date?: string | null;
  installment_status?: string | null;
  created_at: string;
  firstname?: string | null;
  lastname?: string | null;
  user_id: string;
  order?: (AdminOrderDisplaySource & {
    id: string;
    payment_mode?: string;
    total_amount?: string | number;
    deposit_amount?: string | number | null;
    paid_amount?: string | number;
    remaining_balance?: string | number;
    status?: string;
    external_email?: string | null;
    order_items?: AdminOrderItemDisplay[];
  }) | null;
  order_items?: AdminOrderItemDisplay[];
}

const tabs: Array<{ key: PaymentTab; label: string; description: string }> = [
  { key: 'pending', label: 'Pending payments', description: 'Bank transfers awaiting approval or rejection.' },
  { key: 'approved', label: 'Approved payments', description: 'Payment history already approved by admin.' },
  { key: 'rejected', label: 'Rejected payments', description: 'Payment attempts rejected by admin.' },
];

const Spinner = ({ sm }: { sm?: boolean }) => (
  <svg className={`animate-spin text-blue-500 ${sm ? 'w-4 h-4' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not set';

function getPaymentTitle(payment: AdminPayment) {
  if (payment.payment_label) return payment.payment_label;
  if (payment.payment_type === 'INSTALLMENT_DEPOSIT') return 'First deposit';
  if (payment.payment_type === 'INSTALLMENT_PAYMENT') {
    return payment.installment_number ? `Installment ${payment.installment_number}` : 'Installment payment';
  }
  return payment.payment_mode === 'INSTALLMENT' || payment.installment_id ? 'Installment' : 'Full payment';
}

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>('pending');
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'APPROVE' | 'REJECT' } | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const res = await fetch(`${API_URL}/admin/payments/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || `Request failed: ${res.status}`);
        setPayments([]);
        return;
      }
      setPayments(Array.isArray(data) ? data : data.payments ?? data.data ?? []);
    } catch {
      setError('Connection error. Check your network or server.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPayments().catch(() => undefined);
  }, [fetchPayments]);

  const handleAction = async (id: string, actionUrl: 'approve' | 'reject') => {
    setConfirmAction(null);
    setProcessingId(id);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const res = await fetch(`${API_URL}/admin/payments/${id}/${actionUrl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        if (actionUrl === 'approve') setSuccessId(id);
        else setRejectedId(id);

        setTimeout(() => {
          setPayments((prev) => prev.filter((payment) => payment.id !== id));
          setSuccessId(null);
          setRejectedId(null);
        }, 1000);
      } else {
        setError(data.message || `Failed to ${actionUrl} payment.`);
      }
    } catch {
      setError('Connection error.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = payments.filter((payment) => {
    const needle = search.toLowerCase();
    const searchable = [
      payment.reference,
      displayName(payment),
      payment.order_id,
      payment.email,
      payment.external_email,
      getPaymentTitle(payment),
      orderSummary(payment),
      productsText(payment),
      variantsText(payment),
    ];

    return searchable.some((value) => String(value ?? '').toLowerCase().includes(needle));
  });

  const activeTabMeta = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const isPending = activeTab === 'pending';

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{activeTabMeta.label}</h1>
          {payments.length > 0 && (
            <span className="w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {payments.length} records
            </span>
          )}
        </div>
        <p className="text-white/40 text-sm leading-relaxed">
          {activeTabMeta.description} <span className="text-white/60 tabular-nums">{formatMoney(totalAmount)}</span> total.
        </p>
      </motion.div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setSearch('');
              setConfirmAction(null);
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                : 'border-white/10 bg-white/5 text-white/55 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label.replace(' payments', '')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label={`${activeTabMeta.label} count`} value={payments.length} />
        <StatCard label="Total amount" value={formatMoney(totalAmount)} />
        <StatCard label="Total items" value={payments.reduce((sum, payment) => sum + totalQuantity(payment), 0)} />
      </div>

      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by payment, order, product, customer, or reference..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/8 bg-white/2"
        >
          <p className="text-white font-semibold text-lg mb-1">No records found.</p>
          <p className="text-white/40 text-sm">{isPending ? 'No pending bank transfer payments.' : `No ${activeTab} payment history yet.`}</p>
        </motion.div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            <AnimatePresence>
              {filtered.map((payment, index) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  index={index}
                  isPending={isPending}
                  processingId={processingId}
                  successId={successId}
                  rejectedId={rejectedId}
                  confirmAction={confirmAction}
                  setConfirmAction={setConfirmAction}
                  onAction={handleAction}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="hidden lg:block rounded-2xl border border-white/8 overflow-x-auto">
            <table className="w-full text-sm min-w-[1480px]">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="text-left px-5 py-3.5 text-white/40 font-medium">Customer</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Payment</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Order</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Products</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Variants</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Amount</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Method</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Date</th>
                  <th className="px-4 py-3.5 text-right text-white/40 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((payment, index) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      index={index}
                      isPending={isPending}
                      processingId={processingId}
                      successId={successId}
                      rejectedId={rejectedId}
                      confirmAction={confirmAction}
                      setConfirmAction={setConfirmAction}
                      onAction={handleAction}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-5 border border-white/8 bg-white/[0.03]">
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function PaymentCard({
  payment,
  index,
  isPending,
  processingId,
  successId,
  rejectedId,
  confirmAction,
  setConfirmAction,
  onAction,
}: {
  payment: AdminPayment;
  index: number;
  isPending: boolean;
  processingId: string | null;
  successId: string | null;
  rejectedId: string | null;
  confirmAction: { id: string; type: 'APPROVE' | 'REJECT' } | null;
  setConfirmAction: (action: { id: string; type: 'APPROVE' | 'REJECT' } | null) => void;
  onAction: (id: string, actionUrl: 'approve' | 'reject') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: successId === payment.id || rejectedId === payment.id ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
    >
      <PaymentSummary payment={payment} />
      {isPending && (
        <PaymentActions
          payment={payment}
          processingId={processingId}
          successId={successId}
          rejectedId={rejectedId}
          confirmAction={confirmAction}
          setConfirmAction={setConfirmAction}
          onAction={onAction}
          mobile
        />
      )}
    </motion.div>
  );
}

function PaymentRow({
  payment,
  index,
  isPending,
  processingId,
  successId,
  rejectedId,
  confirmAction,
  setConfirmAction,
  onAction,
}: {
  payment: AdminPayment;
  index: number;
  isPending: boolean;
  processingId: string | null;
  successId: string | null;
  rejectedId: string | null;
  confirmAction: { id: string; type: 'APPROVE' | 'REJECT' } | null;
  setConfirmAction: (action: { id: string; type: 'APPROVE' | 'REJECT' } | null) => void;
  onAction: (id: string, actionUrl: 'approve' | 'reject') => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{
        opacity: successId === payment.id || rejectedId === payment.id ? 0 : 1,
        x: 0,
        backgroundColor:
          successId === payment.id ? 'rgba(34,197,94,0.08)' : rejectedId === payment.id ? 'rgba(239,68,68,0.08)' : '',
      }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-white/5 hover:bg-white/3 transition-colors align-top"
    >
      <td className="px-5 py-4">
        <p className="text-white font-medium">{displayName(payment)}</p>
        <p className="text-white/40 text-xs break-all">{payment.email ?? payment.user_id}</p>
      </td>
      <td className="px-4 py-4">
        <PaymentTypeBadge payment={payment} />
        <p className="text-white/45 text-xs mt-2 break-all">Reference: {payment.reference || 'N/A'}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-white font-semibold max-w-[240px]">{orderSummary(payment)}</p>
        <p className="text-white/35 text-xs font-mono break-all mt-1">ID: {payment.order_id}</p>
      </td>
      <td className="px-4 py-4 text-white/70 max-w-[240px]">{productsText(payment)}</td>
      <td className="px-4 py-4 text-white/60 max-w-[220px]">{variantsText(payment)}</td>
      <td className="px-4 py-4">
        <p className="text-white font-bold text-base">{formatMoney(payment.amount)}</p>
        {payment.total_amount !== undefined && <p className="text-white/50 text-xs">Total: {formatMoney(payment.total_amount)}</p>}
        {payment.remaining_balance !== undefined && <p className="text-white/50 text-xs">Balance: {formatMoney(payment.remaining_balance)}</p>}
      </td>
      <td className="px-4 py-4 text-white/55 text-xs">
        <p>{payment.payment_method}</p>
        {payment.external_email && <p className="text-blue-300 break-all mt-1">Cbrilliance: {payment.external_email}</p>}
      </td>
      <td className="px-4 py-4 text-white/50 text-xs">{fmtDate(payment.created_at)}</td>
      <td className="px-4 py-4 text-right">
        {isPending ? (
          <PaymentActions
            payment={payment}
            processingId={processingId}
            successId={successId}
            rejectedId={rejectedId}
            confirmAction={confirmAction}
            setConfirmAction={setConfirmAction}
            onAction={onAction}
          />
        ) : (
          <StatusBadge status={payment.status} />
        )}
      </td>
    </motion.tr>
  );
}

function PaymentSummary({ payment }: { payment: AdminPayment }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-medium">{displayName(payment)}</p>
          <p className="text-white/40 text-xs mt-0.5 break-all">{payment.email ?? payment.user_id}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <p className="text-white font-bold text-lg tabular-nums">{formatMoney(payment.amount)}</p>
      <code className="inline-block text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 font-mono break-all max-w-full">
        {payment.reference || 'No reference'}
      </code>
      <PaymentTypeBadge payment={payment} />
      <OrderContext payment={payment} />
      <OrderItemsList items={orderItems(payment)} />
      <p className="text-white/50 text-xs">{fmtDate(payment.created_at)}</p>
    </div>
  );
}

function PaymentActions({
  payment,
  processingId,
  successId,
  rejectedId,
  confirmAction,
  setConfirmAction,
  onAction,
  mobile,
}: {
  payment: AdminPayment;
  processingId: string | null;
  successId: string | null;
  rejectedId: string | null;
  confirmAction: { id: string; type: 'APPROVE' | 'REJECT' } | null;
  setConfirmAction: (action: { id: string; type: 'APPROVE' | 'REJECT' } | null) => void;
  onAction: (id: string, actionUrl: 'approve' | 'reject') => void;
  mobile?: boolean;
}) {
  const currentConfirm = confirmAction?.id === payment.id ? confirmAction.type : null;
  const buttonBase = mobile ? 'w-full py-2.5 rounded-xl text-sm font-bold' : 'px-3 py-1.5 rounded-lg text-xs font-bold';

  if (currentConfirm) {
    return (
      <div className={`flex ${mobile ? 'flex-col mt-4 pt-3 border-t border-white/8' : 'flex-col items-stretch min-w-[320px]'} gap-2 text-left`}>
        <div className="rounded-xl border border-white/8 bg-black/20 p-3 space-y-2">
          <p className="text-white text-xs font-semibold">{getPaymentTitle(payment)}</p>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-white/50">
            <p>Order: <span className="text-white/75">{orderSummary(payment)}</span></p>
            <p>Reference: <span className="text-white/75">{payment.reference || 'N/A'}</span></p>
            <p>Amount: <span className="text-white/75">{formatMoney(payment.amount)}</span></p>
            <p>Method: <span className="text-white/75">{payment.payment_method}</span></p>
          </div>
          <OrderItemsList items={orderItems(payment)} compact />
        </div>
        <button
          type="button"
          onClick={() => onAction(payment.id, currentConfirm === 'APPROVE' ? 'approve' : 'reject')}
          disabled={processingId === payment.id}
          className={`${buttonBase} text-white flex items-center justify-center gap-2 disabled:opacity-50 ${currentConfirm === 'APPROVE' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'}`}
        >
          {processingId === payment.id ? <><Spinner sm /> Processing...</> : `Confirm ${currentConfirm === 'APPROVE' ? 'approval' : 'rejection'}`}
        </button>
        <button
          type="button"
          onClick={() => setConfirmAction(null)}
          className={`${mobile ? 'w-full py-2 rounded-xl text-sm' : 'px-3 py-1.5 rounded-lg text-xs'} text-white/60 border border-white/10 hover:text-white`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={`flex ${mobile ? 'grid grid-cols-2 mt-4 pt-3 border-t border-white/8' : 'items-center justify-end'} gap-2`}>
      <button
        type="button"
        onClick={() => setConfirmAction({ id: payment.id, type: 'APPROVE' })}
        disabled={processingId === payment.id || successId === payment.id || rejectedId === payment.id}
        className={`${mobile ? 'py-2.5 rounded-xl text-xs' : 'px-4 py-1.5 rounded-lg text-xs'} font-semibold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 disabled:opacity-40`}
      >
        {successId === payment.id ? 'Approved' : 'Approve'}
      </button>
      <button
        type="button"
        onClick={() => setConfirmAction({ id: payment.id, type: 'REJECT' })}
        disabled={processingId === payment.id || successId === payment.id || rejectedId === payment.id}
        className={`${mobile ? 'py-2.5 rounded-xl text-xs' : 'px-4 py-1.5 rounded-lg text-xs'} font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 disabled:opacity-40`}
      >
        {rejectedId === payment.id ? 'Rejected' : 'Reject'}
      </button>
    </div>
  );
}

function PaymentTypeBadge({ payment }: { payment: AdminPayment }) {
  return (
    <div className="space-y-1">
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${payment.payment_mode === 'INSTALLMENT' || payment.installment_id || payment.payment_type?.includes('INSTALLMENT') ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'}`}>
        {getPaymentTitle(payment)}
      </span>
      {payment.payment_type && <p className="text-white/35 text-xs">{payment.payment_type}</p>}
    </div>
  );
}

function OrderContext({ payment }: { payment: AdminPayment }) {
  return (
    <div className="space-y-1 text-xs">
      <p className="text-white font-semibold">{orderSummary(payment)}</p>
      <p className="text-white/45 break-all">Order ID: {shortId(payment.order_id)}</p>
      <p className="text-white/50">Products: {productsText(payment)}</p>
      <p className="text-white/50">Variants: {variantsText(payment)}</p>
      <p className="text-white/50">Quantity: {totalQuantity(payment)}</p>
      {payment.external_email && <p className="text-blue-300 break-all">Cbrilliance: {payment.external_email}</p>}
      {payment.total_amount !== undefined && <p className="text-white/50">Total: {formatMoney(payment.total_amount)}</p>}
      {payment.deposit_amount !== undefined && <p className="text-white/50">Deposit: {formatMoney(payment.deposit_amount)}</p>}
      {payment.paid_amount !== undefined && <p className="text-white/50">Paid: {formatMoney(payment.paid_amount)}</p>}
      {payment.remaining_balance !== undefined && <p className="text-white/50">Balance: {formatMoney(payment.remaining_balance)}</p>}
      {payment.order_status && <p className="text-white/40">Order status: {payment.order_status}</p>}
      <p className="text-white/40">Method: {payment.payment_method}</p>
    </div>
  );
}

function OrderItemsList({ items, compact }: { items: AdminOrderItemDisplay[]; compact?: boolean }) {
  if (!items.length) {
    return <p className="text-white/30 text-xs italic">No item rows returned.</p>;
  }

  return (
    <div className={`space-y-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {items.map((item, index) => (
        <div key={item.order_item_id ?? item.id ?? `${itemLabel(item)}-${index}`} className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-white font-medium">{itemLabel(item)}</p>
            <p className="text-white/70 shrink-0">x{item.quantity ?? 0}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-white/45">
            <span>Unit: {formatMoney(itemUnitPrice(item))}</span>
            <span>Line: {formatMoney(itemLineTotal(item))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status ?? '').toUpperCase();
  const className =
    normalized === 'SUCCESS' || normalized === 'APPROVED' || normalized === 'PAID'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : normalized === 'FAILED' || normalized === 'REJECTED'
        ? 'border-red-500/25 bg-red-500/10 text-red-300'
        : 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300';

  return (
    <span className={`w-fit rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {status ?? 'PENDING'}
    </span>
  );
}
