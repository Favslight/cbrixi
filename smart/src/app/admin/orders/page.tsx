'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';

interface PendingOrder {
    id: string;
    user_id: string;
    total_amount: string;
    deposit_amount?: string;
    remaining_balance?: string;
    payment_mode: string;
    status: string;
    external_email?: string;
    created_at: string;
}

const Spinner = ({ sm }: { sm?: boolean }) => (
    <svg className={`animate-spin text-blue-500 ${sm ? 'w-4 h-4' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

const fmt = (n: string | number) =>
    `₦${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [rejectedId, setRejectedId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'APPROVE' | 'REJECT' } | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken') ?? '';
            const res = await fetch(`${API_URL}/admin/orders/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || `Request failed: ${res.status}`);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : data.orders ?? data.data ?? []);
        } catch { setError('Connection error. Check your network or server.'); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleAction = async (id: string, actionUrl: 'approve' | 'reject') => {
        setConfirmAction(null);
        setProcessingId(id);
        setError('');
        try {
            const token = localStorage.getItem('adminToken') ?? '';
            const res = await fetch(`${API_URL}/admin/orders/${id}/${actionUrl}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                if (actionUrl === 'approve') setSuccessId(id);
                else setRejectedId(id);
                
                setTimeout(() => {
                    setOrders(prev => prev.filter(o => o.id !== id));
                    if (actionUrl === 'approve') setSuccessId(null);
                    else setRejectedId(null);
                }, 1600);
            } else {
                setError(data.message || `Failed to ${actionUrl} order.`);
            }
        } catch { setError('Connection error.'); }
        setProcessingId(null);
    };

    const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        (o.external_email && o.external_email.toLowerCase().includes(search.toLowerCase())) ||
        o.user_id.toLowerCase().includes(search.toLowerCase())
    );

    const totalPending = orders.reduce((a, o) => a + Number(o.total_amount), 0);

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-white">Pending Orders</h1>
                    {orders.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                            {orders.length} awaiting approval
                        </span>
                    )}
                </div>
                <p className="text-white/40 text-sm">
                    Orders requesting installment plans awaiting your approval
                </p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Awaiting Approvals', value: orders.length, icon: '📦', color: 'from-blue-500/20 to-blue-900/10 border-blue-500/20' },
                    { label: 'Total Value', value: fmt(totalPending), icon: '💰', color: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/20' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
                        className={`rounded-2xl p-5 border bg-gradient-to-br ${s.color}`}>
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <p className="text-xl font-bold text-white">{s.value}</p>
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
                    placeholder="Search by order ID or email…"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                        ⚠️ {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16"><Spinner /></div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/8 bg-white/2">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">✅</div>
                    <p className="text-white font-semibold text-lg mb-1">You're all caught up!</p>
                    <p className="text-white/40 text-sm">No orders awaiting approval.</p>
                </motion.div>
            ) : (
                <div className="rounded-2xl border border-white/8 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/8 bg-white/3">
                                <th className="text-left px-5 py-3.5 text-white/40 font-medium">Order ID</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Values</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">External Email (If any)</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Date</th>
                                <th className="px-4 py-3.5 text-right text-white/40 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filtered.map((o, i) => (
                                    <motion.tr key={o.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: (successId === o.id || rejectedId === o.id) ? 0 : 1, x: 0, backgroundColor: successId === o.id ? 'rgba(34,197,94,0.08)' : rejectedId === o.id ? 'rgba(239,68,68,0.08)' : '' }}
                                        exit={{ opacity: 0, x: 12 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors">

                                        {/* Order ID */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    📦
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium font-mono text-xs">{o.id}</p>
                                                    <p className="text-white/40 text-xs font-mono">User: {o.user_id.slice(0, 8)}…</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Amounts */}
                                        <td className="px-4 py-4">
                                            <p className="text-white font-bold text-base">{fmt(o.total_amount)}</p>
                                            {o.deposit_amount && <p className="text-white/50 text-xs mt-1">Dep: {fmt(o.deposit_amount)}</p>}
                                        </td>
                                        
                                        {/* External Email */}
                                        <td className="px-4 py-4">
                                            {o.external_email ? (
                                                <span className="text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-0.5 text-xs">
                                                    {o.external_email}
                                                </span>
                                            ) : (
                                                <span className="text-white/30 text-xs italic">N/A</span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-4 text-white/50 text-xs">{fmtDate(o.created_at)}</td>

                                        {/* Action */}
                                        <td className="px-4 py-4 text-right">
                                            {confirmAction?.id === o.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleAction(o.id, confirmAction.type === 'APPROVE' ? 'approve' : 'reject')}
                                                        disabled={processingId === o.id}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 ${confirmAction.type === 'APPROVE' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'}`}>
                                                        {processingId === o.id ? <><Spinner sm /> Processing…</> : '✓ Confirm'}
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => setConfirmAction(null)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
                                                        Cancel
                                                    </motion.button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => setConfirmAction({ id: o.id, type: 'APPROVE' })}
                                                        disabled={processingId === o.id || successId === o.id || rejectedId === o.id}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                                                        {successId === o.id ? '✓ Approved' : '✓ Approve'}
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => setConfirmAction({ id: o.id, type: 'REJECT' })}
                                                        disabled={processingId === o.id || successId === o.id || rejectedId === o.id}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                                                        {rejectedId === o.id ? '✗ Rejected' : '✗ Reject'}
                                                    </motion.button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
