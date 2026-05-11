'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

interface Installment {
    id: string;
    installment_number: number;
    amount: string;
    due_date: string;
    status: string;
}

interface OrderItem {
    id: string;
    product_id: string;
    name: string;
    price: string;
    quantity: number;
    price_at_purchase: string;
    installment_duration_months: number;
}

interface Order {
    id: string;
    total_amount: string;
    deposit_amount: string;
    remaining_balance: string;
    payment_mode: string;
    status: string;
    created_at: string;
    order_items: OrderItem[];
    installments: Installment[];
}

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    external_user_id: string;
    status: string;
    created_at: string;
    orders: Order[];
}

const Spinner = () => (
    <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

const Badge = ({ value, type }: { value: string; type?: string }) => {
    const colorMap: Record<string, string> = {
        PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        SUCCESS: 'bg-green-500/15  text-green-400  border-green-500/30',
        PAID: 'bg-green-500/15  text-green-400  border-green-500/30',
        FAILED: 'bg-red-500/15    text-red-400    border-red-500/30',
        FULL: 'bg-blue-500/15   text-blue-400   border-blue-500/30',
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

const fmt = (n: string | number) =>
    `₦${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') ?? '' : '';

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users/details`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setUsers(data.users);
            else setError(data.message || 'Failed to load users');
        } catch { setError('Connection error.'); }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
    );

    const totalRevenue = users.reduce((acc, u) =>
        acc + u.orders.reduce((oa, o) => oa + Number(o.deposit_amount), 0), 0
    );

    return (
        <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Users</h1>
                <p className="text-white/40 text-sm mt-1 leading-relaxed">
                    {users.length} registered customers · <span className="text-white/60 tabular-nums">{fmt(totalRevenue)}</span> collected
                </p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                    { label: 'Total Users', value: users.length, icon: '👥', color: 'from-blue-500/20 to-blue-900/10 border-blue-500/20' },
                    { label: 'Active Users', value: users.filter(u => u.status === 'ACTIVE').length, icon: '✅', color: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/20' },
                    { label: 'Total Orders', value: users.reduce((a, u) => a + u.orders.length, 0), icon: '📦', color: 'from-purple-500/20 to-purple-900/10 border-purple-500/20' },
                    { label: 'Revenue Collected', value: fmt(totalRevenue), icon: '💰', color: 'from-orange-500/20 to-orange-900/10 border-orange-500/20' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
                        className={`rounded-2xl p-4 sm:p-5 border bg-gradient-to-br ${s.color}`}>
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <p className="text-lg sm:text-xl font-bold text-white tabular-nums break-words">{s.value}</p>
                        <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16"><Spinner /></div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((user, i) => {
                            const isOpen = expanded === user.id;
                            const totalPaid = user.orders.reduce((a, o) => a + Number(o.deposit_amount), 0);
                            return (
                                <motion.div key={user.id}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">

                                    {/* User row */}
                                    <button onClick={() => setExpanded(isOpen ? null : user.id)}
                                        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-white/4 transition-colors text-left">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {(user.name || user.email)?.[0]?.toUpperCase() ?? '?'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white truncate">{user.name || user.username || '—'}</p>
                                            <p className="text-white/40 text-xs truncate">{user.email}</p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 sm:hidden text-xs">
                                                <span className="text-white/50">{user.orders.length} orders</span>
                                                <span className="text-emerald-400/90 font-medium tabular-nums">{fmt(totalPaid)} paid</span>
                                            </div>
                                        </div>

                                        <div className="hidden sm:flex items-center gap-4 md:gap-6 text-sm shrink-0">
                                            <div className="text-right">
                                                <p className="text-white/40 text-xs">Orders</p>
                                                <p className="font-semibold">{user.orders.length}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/40 text-xs">Paid</p>
                                                <p className="font-semibold text-emerald-400">{fmt(totalPaid)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/40 text-xs">Joined</p>
                                                <p className="font-semibold text-white/60">{fmtDate(user.created_at)}</p>
                                            </div>
                                            <Badge value={user.status || 'ACTIVE'} />
                                        </div>

                                        {/* Chevron */}
                                        <svg className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Expanded user detail */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div key="detail"
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                                                className="overflow-hidden border-t border-white/8">
                                                <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">

                                                    {/* User meta */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                        {[
                                                            { label: 'Email', val: user.email },
                                                            { label: 'Username', val: user.username || '—' },
                                                            { label: 'External ID', val: user.external_user_id || '—' },
                                                            { label: 'Member since', val: fmtDate(user.created_at) },
                                                        ].map(({ label, val }) => (
                                                            <div key={label} className="bg-white/4 rounded-xl p-3 border border-white/6">
                                                                <p className="text-white/40 text-xs mb-0.5">{label}</p>
                                                                <p className="text-white font-medium truncate">{val}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Orders */}
                                                    {user.orders.length === 0 ? (
                                                        <p className="text-white/30 text-sm pl-1">No orders yet.</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">
                                                                Orders ({user.orders.length})
                                                            </p>
                                                            {user.orders.map(order => {
                                                                const orderOpen = expandedOrder === order.id;
                                                                return (
                                                                    <div key={order.id} className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                                                                        {/* Order header */}
                                                                        <button onClick={() => setExpandedOrder(orderOpen ? null : order.id)}
                                                                            className="w-full flex items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-white/4 transition-colors text-left min-w-0">
                                                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs min-w-0">
                                                                                <div>
                                                                                    <p className="text-white/40">Order ID</p>
                                                                                    <p className="font-mono text-white/80 truncate">{order.id.slice(0, 12)}…</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-white/40">Total</p>
                                                                                    <p className="font-semibold text-white">{fmt(order.total_amount)}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-white/40">Remaining</p>
                                                                                    <p className={`font-semibold ${Number(order.remaining_balance) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                                                        {fmt(order.remaining_balance)}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge value={order.payment_mode} />
                                                                                    <Badge value={order.status} />
                                                                                </div>
                                                                            </div>
                                                                            <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-300 ${orderOpen ? 'rotate-180' : ''}`}
                                                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </button>

                                                                        {/* Order items + installments */}
                                                                        <AnimatePresence>
                                                                            {orderOpen && (
                                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                                                                    className="overflow-hidden border-t border-white/8">
                                                                                    <div className="px-4 py-4 space-y-4">
                                                                                        {/* Items */}
                                                                                        <div>
                                                                                            <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">Items</p>
                                                                                            <div className="space-y-2">
                                                                                                {order.order_items.map(item => (
                                                                                                    <div key={item.id} className="flex items-center justify-between text-sm bg-white/3 rounded-lg px-3 py-2 border border-white/6">
                                                                                                        <span className="font-medium">{item.name}</span>
                                                                                                        <div className="flex items-center gap-4 text-white/60">
                                                                                                            <span>×{item.quantity}</span>
                                                                                                            <span className="text-white font-semibold">{fmt(item.price_at_purchase)}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                        {/* Installments */}
                                                                                        {order.installments.length > 0 && (
                                                                                            <div>
                                                                                                <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">
                                                                                                    Instalments ({order.installments.length})
                                                                                                </p>
                                                                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                                                    {order.installments.map(inst => (
                                                                                                        <div key={inst.id}
                                                                                                            className={`rounded-lg p-2.5 border text-xs ${inst.status === 'PAID' ? 'border-green-500/20 bg-green-500/8' : 'border-white/8 bg-white/3'}`}>
                                                                                                            <p className="text-white/40 mb-0.5">Month {inst.installment_number}</p>
                                                                                                            <p className="font-bold text-white">{fmt(inst.amount)}</p>
                                                                                                            <p className="text-white/40 mt-0.5">{fmtDate(inst.due_date)}</p>
                                                                                                            <Badge value={inst.status} />
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
