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

interface Installment {
  id: string;
  installment_number: number;
  amount: string | number;
  due_date: string;
  status: string;
}

interface Order extends AdminOrderDisplaySource {
  id: string;
  total_amount: string | number;
  deposit_amount?: string | number | null;
  paid_amount?: string | number | null;
  remaining_balance: string | number;
  payment_mode: string;
  status: string;
  created_at: string;
  order_items: AdminOrderItemDisplay[];
  installments?: Installment[];
}

interface User extends AdminOrderDisplaySource {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email: string;
  external_user_id?: string | null;
  status?: string | null;
  created_at: string;
  cbrilliance_email?: string | null;
  cbrilliance_email_verified?: boolean;
  cbrilliance_email_verified_at?: string | null;
  orders: Order[];
}

const Spinner = () => (
  <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

const Badge = ({ value }: { value: string }) => {
  const colorMap: Record<string, string> = {
    PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    SUCCESS: 'bg-green-500/15 text-green-400 border-green-500/30',
    PAID: 'bg-green-500/15 text-green-400 border-green-500/30',
    APPROVED: 'bg-green-500/15 text-green-400 border-green-500/30',
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    FULL: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    INSTALLMENT: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  const cls = colorMap[value?.toUpperCase()] || 'bg-white/10 text-white/60 border-white/20';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {value}
    </span>
  );
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

const paidValue = (order: Order) => Number(order.paid_amount ?? order.deposit_amount ?? 0);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const res = await fetch(`${API_URL}/admin/users/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) setUsers(data.users ?? []);
      else setError(data.message || 'Failed to load users');
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers().catch(() => undefined);
  }, [fetchUsers]);

  const filtered = users.filter((user) => {
    const needle = search.toLowerCase();
    const searchable = [
      user.email,
      displayName(user),
      user.username,
      user.cbrilliance_email,
      ...user.orders.flatMap((order) => [orderSummary(order), productsText(order), variantsText(order), order.id]),
    ];

    return searchable.some((value) => String(value ?? '').toLowerCase().includes(needle));
  });

  const totalRevenue = users.reduce((acc, user) => acc + user.orders.reduce((orderAcc, order) => orderAcc + paidValue(order), 0), 0);

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Users</h1>
        <p className="text-white/40 text-sm mt-1 leading-relaxed">
          {users.length} registered customers · <span className="text-white/60 tabular-nums">{formatMoney(totalRevenue)}</span> collected
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Total users', value: users.length },
          { label: 'Active users', value: users.filter((user) => user.status === 'ACTIVE').length },
          { label: 'Total orders', value: users.reduce((sum, user) => sum + user.orders.length, 0) },
          { label: 'Revenue collected', value: formatMoney(totalRevenue) },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-4 sm:p-5 border border-white/8 bg-white/[0.03]"
          >
            <p className="text-lg sm:text-xl font-bold text-white tabular-nums break-words">{stat.value}</p>
            <p className="text-white/50 text-xs mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, order, product, or variant..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((user, index) => {
              const isOpen = expanded === user.id;
              const totalPaid = user.orders.reduce((sum, order) => sum + paidValue(order), 0);
              const userName = displayName(user);

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : user.id)}
                    className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-white/4 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {userName?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{userName}</p>
                      <p className="text-white/40 text-xs truncate">{user.email}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 sm:hidden text-xs">
                        <span className="text-white/50">{user.orders.length} orders</span>
                        <span className="text-emerald-400/90 font-medium tabular-nums">{formatMoney(totalPaid)} paid</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 md:gap-6 text-sm shrink-0">
                      <div className="text-right">
                        <p className="text-white/40 text-xs">Orders</p>
                        <p className="font-semibold">{user.orders.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">Paid</p>
                        <p className="font-semibold text-emerald-400">{formatMoney(totalPaid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">Joined</p>
                        <p className="font-semibold text-white/60">{fmtDate(user.created_at)}</p>
                      </div>
                      <Badge value={user.status || 'ACTIVE'} />
                    </div>

                    <svg className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-white/8"
                      >
                        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            {[
                              { label: 'Email', val: user.email },
                              { label: 'Username', val: user.username || 'N/A' },
                              { label: 'Cbrilliance email', val: user.cbrilliance_email || 'N/A' },
                              { label: 'Member since', val: fmtDate(user.created_at) },
                            ].map(({ label, val }) => (
                              <div key={label} className="bg-white/4 rounded-xl p-3 border border-white/6">
                                <p className="text-white/40 text-xs mb-0.5">{label}</p>
                                <p className="text-white font-medium truncate">{val}</p>
                              </div>
                            ))}
                          </div>

                          {user.orders.length === 0 ? (
                            <p className="text-white/30 text-sm pl-1">No orders yet.</p>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">
                                Orders ({user.orders.length})
                              </p>
                              {user.orders.map((order) => {
                                const orderOpen = expandedOrder === order.id;
                                return (
                                  <div key={order.id} className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                                    <button
                                      onClick={() => setExpandedOrder(orderOpen ? null : order.id)}
                                      className="w-full flex items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-white/4 transition-colors text-left min-w-0"
                                    >
                                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs min-w-0">
                                        <div className="lg:col-span-2">
                                          <p className="text-white/40">Order</p>
                                          <p className="font-semibold text-white truncate">{orderSummary(order)}</p>
                                          <p className="font-mono text-white/35 truncate">ID: {shortId(order.id)}</p>
                                        </div>
                                        <div>
                                          <p className="text-white/40">Products</p>
                                          <p className="font-medium text-white/75 truncate">{productsText(order)}</p>
                                        </div>
                                        <div>
                                          <p className="text-white/40">Variants</p>
                                          <p className="font-medium text-white/75 truncate">{variantsText(order)}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-white/60">Qty {totalQuantity(order)}</span>
                                          <Badge value={order.payment_mode} />
                                          <Badge value={order.status} />
                                        </div>
                                      </div>
                                      <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-300 ${orderOpen ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>

                                    <AnimatePresence>
                                      {orderOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.25 }}
                                          className="overflow-hidden border-t border-white/8"
                                        >
                                          <div className="px-4 py-4 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                              <OrderMetric label="Total" value={formatMoney(order.total_amount)} />
                                              <OrderMetric label="Paid" value={formatMoney(order.paid_amount ?? order.deposit_amount)} />
                                              <OrderMetric label="Remaining" value={formatMoney(order.remaining_balance)} />
                                            </div>

                                            <div>
                                              <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">Items</p>
                                              <OrderItemsList items={order.order_items ?? []} />
                                            </div>

                                            {(order.installments ?? []).length > 0 && (
                                              <div>
                                                <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">
                                                  Installments ({order.installments?.length})
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                  {order.installments?.map((installment) => (
                                                    <div
                                                      key={installment.id}
                                                      className={`rounded-lg p-2.5 border text-xs ${installment.status === 'PAID' ? 'border-green-500/20 bg-green-500/8' : 'border-white/8 bg-white/3'}`}
                                                    >
                                                      <p className="text-white/40 mb-0.5">Month {installment.installment_number}</p>
                                                      <p className="font-bold text-white">{formatMoney(installment.amount)}</p>
                                                      <p className="text-white/40 mt-0.5">{fmtDate(installment.due_date)}</p>
                                                      <Badge value={installment.status} />
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && !loading && (
            <p className="text-center py-16 text-white/30">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/3 p-3">
      <p className="text-white/40 mb-0.5">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}

function OrderItemsList({ items }: { items: AdminOrderItemDisplay[] }) {
  if (!items.length) {
    return <p className="text-white/30 text-sm">No item rows returned.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.order_item_id ?? item.id ?? `${itemLabel(item)}-${index}`}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm bg-white/3 rounded-lg px-3 py-2 border border-white/6"
        >
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{itemLabel(item)}</p>
            <p className="text-white/40 text-xs truncate">Unit: {formatMoney(itemUnitPrice(item))}</p>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <span>x{item.quantity ?? 0}</span>
            <span className="text-white font-semibold">{formatMoney(itemLineTotal(item))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
