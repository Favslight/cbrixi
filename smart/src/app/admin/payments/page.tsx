'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';

interface PendingPayment {
    id: string;
    reference: string;
    amount: string;
    payment_method: string;
    status: string;
    order_id: string;
    installment_id: string | null;
    created_at: string;
    firstname: string;
    lastname: string;
    user_id: string;
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

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<PendingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken') ?? '';
            const res = await fetch(`${API_URL}/admin/payments/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || `Request failed: ${res.status}`);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : data.payments ?? data.data ?? []);
        } catch { setError('Connection error. Check your network or server.'); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const handleApprove = async (id: string) => {
        setConfirmId(null);
        setApprovingId(id);
        setError('');
        try {
            const token = localStorage.getItem('adminToken') ?? '';
            const res = await fetch(`${API_URL}/admin/payments/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccessId(id);
                setTimeout(() => {
                    setPayments(prev => prev.filter(p => p.id !== id));
                    setSuccessId(null);
                }, 1600);
            } else {
                setError(data.message || 'Failed to approve payment.');
            }
        } catch { setError('Connection error.'); }
        setApprovingId(null);
    };

    const filtered = payments.filter(p =>
        p.reference.toLowerCase().includes(search.toLowerCase()) ||
        `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase())
    );

    const totalPending = payments.reduce((a, p) => a + Number(p.amount), 0);

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-white">Pending Payments</h1>
                    {payments.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">
                            {payments.length} pending
                        </span>
                    )}
                </div>
                <p className="text-white/40 text-sm">
                    Bank transfer payments awaiting your approval · {fmt(totalPending)} total pending
                </p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Pending Approvals', value: payments.length, icon: '⏳', color: 'from-yellow-500/20 to-yellow-900/10 border-yellow-500/20' },
                    { label: 'Total Pending Amount', value: fmt(totalPending), icon: '💸', color: 'from-orange-500/20 to-orange-900/10 border-orange-500/20' },
                    { label: 'Awaiting Customers', value: new Set(payments.map(p => p.user_id)).size, icon: '👤', color: 'from-purple-500/20 to-purple-900/10 border-purple-500/20' },
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
                    placeholder="Search by reference or name…"
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
                    <p className="text-white font-semibold text-lg mb-1">All clear!</p>
                    <p className="text-white/40 text-sm">No pending bank transfer payments.</p>
                </motion.div>
            ) : (
                <div className="rounded-2xl border border-white/8 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/8 bg-white/3">
                                <th className="text-left px-5 py-3.5 text-white/40 font-medium">Customer</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Reference</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Amount</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Date</th>
                                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Type</th>
                                <th className="px-4 py-3.5 text-right text-white/40 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filtered.map((p, i) => (
                                    <motion.tr key={p.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: successId === p.id ? 0 : 1, x: 0, backgroundColor: successId === p.id ? 'rgba(34,197,94,0.08)' : '' }}
                                        exit={{ opacity: 0, x: 12 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors">

                                        {/* Customer */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {p.firstname?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{p.firstname} {p.lastname}</p>
                                                    <p className="text-white/40 text-xs font-mono">{p.user_id.slice(0, 8)}…</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Reference */}
                                        <td className="px-4 py-4">
                                            <code className="text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-0.5 text-xs font-mono">
                                                {p.reference}
                                            </code>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-4 py-4">
                                            <span className="text-white font-bold text-base">{fmt(p.amount)}</span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-4 text-white/50 text-xs">{fmtDate(p.created_at)}</td>

                                        {/* Type */}
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${p.installment_id ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'}`}>
                                                {p.installment_id ? 'Instalment' : 'Full Payment'}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-4 text-right">
                                            {confirmId === p.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleApprove(p.id)}
                                                        disabled={approvingId === p.id}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-400 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                                                        {approvingId === p.id ? <><Spinner sm /> Approving…</> : '✓ Confirm'}
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => setConfirmId(null)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
                                                        Cancel
                                                    </motion.button>
                                                </div>
                                            ) : (
                                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => setConfirmId(p.id)}
                                                    disabled={approvingId === p.id || successId === p.id}
                                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                                                    {successId === p.id ? '✓ Approved' : '✓ Approve'}
                                                </motion.button>
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
