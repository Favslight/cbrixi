'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type AdminOrderDisplaySource,
  type AdminOrderItemDisplay,
  displayName,
  itemLabel,
  itemLineTotal,
  itemUnitPrice,
  orderSummary,
  productsText,
  shortId,
  totalQuantity,
  variantsText,
} from '@/lib/adminOrderDisplay';
import { formatMoney } from '@/lib/pricing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

type OrderTab = 'pending' | 'approved' | 'rejected';

interface AdminOrder extends AdminOrderDisplaySource {
  id: string;
  user_id: string;
  total_amount: string | number;
  deposit_amount?: string | number | null;
  remaining_balance?: string | number | null;
  paid_amount?: string | number | null;
  payment_mode: string;
  status: string;
  external_email?: string | null;
  external_email_exists?: boolean;
  verified_user_id?: string | null;
  verified_email?: string | null;
  verified_firstname?: string | null;
  verified_lastname?: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: AdminOrderItemDisplay[];
}

const tabs: Array<{ key: OrderTab; label: string; description: string }> = [
  { key: 'pending', label: 'Pending orders', description: 'Installment requests awaiting admin review.' },
  { key: 'approved', label: 'Approved orders', description: 'Installment orders already approved by admin.' },
  { key: 'rejected', label: 'Rejected orders', description: 'Installment requests rejected by admin.' },
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

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('pending');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'APPROVE' | 'REJECT' } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const res = await fetch(`${API_URL}/admin/orders/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || `Request failed: ${res.status}`);
        setOrders([]);
        return;
      }
      setOrders(Array.isArray(data) ? data : data.orders ?? data.data ?? []);
    } catch {
      setError('Connection error. Check your network or server.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders().catch(() => undefined);
  }, [fetchOrders]);

  const handleAction = async (id: string, actionUrl: 'approve' | 'reject') => {
    setConfirmAction(null);
    setProcessingId(id);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const res = await fetch(`${API_URL}/admin/orders/${id}/${actionUrl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        if (actionUrl === 'approve') setSuccessId(id);
        else setRejectedId(id);

        setTimeout(() => {
          setOrders((prev) => prev.filter((order) => order.id !== id));
          setSuccessId(null);
          setRejectedId(null);
        }, 1000);
      } else {
        setError(data.message || `Failed to ${actionUrl} order.`);
      }
    } catch {
      setError('Connection error.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = orders.filter((order) => {
    const needle = search.toLowerCase();
    const searchable = [
      order.id,
      order.user_id,
      order.user_email,
      order.email,
      order.external_email,
      order.verified_email,
      displayName(order),
      orderSummary(order),
      productsText(order),
      variantsText(order),
    ];

    return searchable.some((value) => String(value ?? '').toLowerCase().includes(needle));
  });

  const activeTabMeta = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const totalValue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const isPending = activeTab === 'pending';

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{activeTabMeta.label}</h1>
          {orders.length > 0 && (
            <span className="w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {orders.length} records
            </span>
          )}
        </div>
        <p className="text-white/40 text-sm">{activeTabMeta.description}</p>
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
            {tab.label.replace(' orders', '')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <StatCard label={`${activeTabMeta.label} count`} value={orders.length} />
        <StatCard label="Total value" value={formatMoney(totalValue)} />
        <StatCard label="Total items" value={orders.reduce((sum, order) => sum + totalQuantity(order), 0)} />
      </div>

      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by order, product, customer, variant, or email..."
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
          <p className="text-white/40 text-sm">{isPending ? 'No orders awaiting approval.' : `No ${activeTab} order history yet.`}</p>
        </motion.div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            <AnimatePresence>
              {filtered.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
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
            <table className="w-full text-sm min-w-[1380px]">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="text-left px-5 py-3.5 text-white/40 font-medium">Customer</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Order</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Products</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Variants</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Qty</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Values</th>
                  <th className="text-left px-4 py-3.5 text-white/40 font-medium">Date</th>
                  <th className="px-4 py-3.5 text-right text-white/40 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((order, index) => (
                    <OrderRow
                      key={order.id}
                      order={order}
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

function OrderCard({
  order,
  index,
  isPending,
  processingId,
  successId,
  rejectedId,
  confirmAction,
  setConfirmAction,
  onAction,
}: {
  order: AdminOrder;
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
      animate={{ opacity: successId === order.id || rejectedId === order.id ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4 ${successId === order.id ? 'ring-1 ring-green-500/30' : ''} ${rejectedId === order.id ? 'ring-1 ring-red-500/30' : ''}`}
    >
      <OrderSummaryBlock order={order} />
      {isPending && (
        <OrderActions
          order={order}
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

function OrderRow({
  order,
  index,
  isPending,
  processingId,
  successId,
  rejectedId,
  confirmAction,
  setConfirmAction,
  onAction,
}: {
  order: AdminOrder;
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
        opacity: successId === order.id || rejectedId === order.id ? 0 : 1,
        x: 0,
        backgroundColor: successId === order.id ? 'rgba(34,197,94,0.08)' : rejectedId === order.id ? 'rgba(239,68,68,0.08)' : '',
      }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-white/5 hover:bg-white/3 transition-colors align-top"
    >
      <td className="px-5 py-4">
        <p className="text-white font-medium">{displayName(order)}</p>
        <p className="text-white/40 text-xs break-all mt-1">{order.user_email ?? order.email ?? order.user_id}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-white font-semibold max-w-[260px]">{orderSummary(order)}</p>
        <p className="text-white/35 text-xs font-mono break-all mt-1">ID: {order.id}</p>
        {order.external_email && <p className="text-blue-300 text-xs break-all mt-1">Cbrilliance: {order.external_email}</p>}
      </td>
      <td className="px-4 py-4 text-white/70 max-w-[240px]">{productsText(order)}</td>
      <td className="px-4 py-4 text-white/60 max-w-[220px]">{variantsText(order)}</td>
      <td className="px-4 py-4 text-white font-semibold tabular-nums">{totalQuantity(order)}</td>
      <td className="px-4 py-4">
        <OrderValues order={order} />
      </td>
      <td className="px-4 py-4 text-white/50 text-xs">{fmtDate(order.created_at)}</td>
      <td className="px-4 py-4 text-right">
        {isPending ? (
          <OrderActions
            order={order}
            processingId={processingId}
            successId={successId}
            rejectedId={rejectedId}
            confirmAction={confirmAction}
            setConfirmAction={setConfirmAction}
            onAction={onAction}
          />
        ) : (
          <StatusBadge status={order.status} />
        )}
      </td>
    </motion.tr>
  );
}

function OrderSummaryBlock({ order }: { order: AdminOrder }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-semibold">{orderSummary(order)}</p>
          <p className="text-white/40 text-xs mt-1">{displayName(order)}</p>
          <p className="text-white/35 text-xs font-mono break-all mt-1">ID: {order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <InfoLine label="Products" value={productsText(order)} />
        <InfoLine label="Variants" value={variantsText(order)} />
        <InfoLine label="Quantity" value={String(totalQuantity(order))} />
      </div>
      <OrderItemsList items={order.order_items ?? []} />
      <OrderValues order={order} />
      {order.external_email ? (
        <p className="text-blue-300 text-xs break-all">Cbrilliance: {order.external_email}</p>
      ) : (
        <p className="text-white/30 text-xs italic">No external email</p>
      )}
      <VerificationBlock order={order} />
      <p className="text-white/50 text-xs">{fmtDate(order.created_at)}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/35">{label}: </span>
      <span className="text-white/70">{value}</span>
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

function OrderValues({ order }: { order: AdminOrder }) {
  return (
    <div className="space-y-1">
      <p className="text-white font-bold text-base">{formatMoney(order.total_amount)}</p>
      {order.paid_amount !== undefined && <p className="text-white/50 text-xs">Paid: {formatMoney(order.paid_amount)}</p>}
      {order.remaining_balance !== undefined && <p className="text-white/50 text-xs">Balance: {formatMoney(order.remaining_balance)}</p>}
      {order.deposit_amount !== undefined && <p className="text-white/50 text-xs">Deposit: {formatMoney(order.deposit_amount)}</p>}
      <p className="text-white/40 text-xs">{order.payment_mode}</p>
    </div>
  );
}

function VerificationBlock({ order }: { order: AdminOrder }) {
  if (!order.external_email) {
    return <span className="inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white/35">No email</span>;
  }

  return (
    <div>
      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${order.external_email_exists ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-red-500/25 bg-red-500/10 text-red-300'}`}>
        {order.external_email_exists ? 'Email exists' : 'Email not found'}
      </span>
      {order.external_email_exists && (
        <p className="text-white/45 text-xs mt-2 break-all">
          {[order.verified_firstname, order.verified_lastname].filter(Boolean).join(' ') || order.verified_email}
        </p>
      )}
    </div>
  );
}

function OrderActions({
  order,
  processingId,
  successId,
  rejectedId,
  confirmAction,
  setConfirmAction,
  onAction,
  mobile,
}: {
  order: AdminOrder;
  processingId: string | null;
  successId: string | null;
  rejectedId: string | null;
  confirmAction: { id: string; type: 'APPROVE' | 'REJECT' } | null;
  setConfirmAction: (action: { id: string; type: 'APPROVE' | 'REJECT' } | null) => void;
  onAction: (id: string, actionUrl: 'approve' | 'reject') => void;
  mobile?: boolean;
}) {
  const currentConfirm = confirmAction?.id === order.id ? confirmAction.type : null;
  const buttonBase = mobile ? 'w-full py-2.5 rounded-xl text-sm font-bold' : 'px-3 py-1.5 rounded-lg text-xs font-bold';

  if (currentConfirm) {
    return (
      <div className={`flex ${mobile ? 'flex-col mt-4 pt-3 border-t border-white/8' : 'flex-col items-stretch min-w-[280px]'} gap-2 text-left`}>
        <div className="rounded-xl border border-white/8 bg-black/20 p-3">
          <p className="text-white text-xs font-semibold">{orderSummary(order)}</p>
          <p className="text-white/40 text-[11px] mt-1">Order ID: {shortId(order.id)}</p>
          <OrderItemsList items={order.order_items ?? []} compact />
        </div>
        <button
          type="button"
          onClick={() => onAction(order.id, currentConfirm === 'APPROVE' ? 'approve' : 'reject')}
          disabled={processingId === order.id}
          className={`${buttonBase} text-white flex items-center justify-center gap-2 disabled:opacity-50 ${currentConfirm === 'APPROVE' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'}`}
        >
          {processingId === order.id ? <><Spinner sm /> Processing...</> : `Confirm ${currentConfirm === 'APPROVE' ? 'approval' : 'rejection'}`}
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
        onClick={() => setConfirmAction({ id: order.id, type: 'APPROVE' })}
        disabled={processingId === order.id || successId === order.id || rejectedId === order.id || order.external_email_exists === false}
        className={`${mobile ? 'py-2.5 rounded-xl text-xs' : 'px-4 py-1.5 rounded-lg text-xs'} font-semibold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 disabled:opacity-40`}
      >
        {successId === order.id ? 'Approved' : 'Approve'}
      </button>
      <button
        type="button"
        onClick={() => setConfirmAction({ id: order.id, type: 'REJECT' })}
        disabled={processingId === order.id || successId === order.id || rejectedId === order.id}
        className={`${mobile ? 'py-2.5 rounded-xl text-xs' : 'px-4 py-1.5 rounded-lg text-xs'} font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 disabled:opacity-40`}
      >
        {rejectedId === order.id ? 'Rejected' : 'Reject'}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status ?? '').toUpperCase();
  const className =
    normalized === 'PAID' || normalized === 'APPROVED' || normalized === 'SUCCESS'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : normalized === 'REJECTED' || normalized === 'FAILED'
        ? 'border-red-500/25 bg-red-500/10 text-red-300'
        : 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300';

  return (
    <span className={`w-fit rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {status ?? 'PENDING'}
    </span>
  );
}
