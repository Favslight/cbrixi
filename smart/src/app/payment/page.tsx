'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

type Method = 'PAYSTACK' | 'BANK_TRANSFER';

interface BankDetails {
    reference: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    amount: number;
}

const Spinner = ({ sm }: { sm?: boolean }) => (
    <svg className={`animate-spin text-white ${sm ? 'w-4 h-4' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

function PaymentContent() {
    const router = useRouter();
    const params = useSearchParams();

    const orderId = params.get('order_id') || '';
    const total = parseFloat(params.get('total') || '0');
    const mode = (params.get('mode') || 'FULL') as 'FULL' | 'INSTALLMENT';
    const deposit = parseFloat(params.get('deposit') || '0');
    const amountDue = mode === 'INSTALLMENT' ? deposit : total;

    const [method, setMethod] = useState<Method>('PAYSTACK');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        if (!localStorage.getItem('userToken')) router.push('/auth/login');
        if (!orderId) router.push('/cart');
    }, [orderId, router]);

    const handlePaystack = async () => {
        const token = localStorage.getItem('userToken');
        setProcessing(true); setError('');
        try {
            const res = await fetch(`${API_URL}/payment/paystack/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ order_id: orderId, installment_id: null, amount: amountDue })
            });
            const data = await res.json();
            if (data.payment_link) {
                window.location.href = data.payment_link; // Redirect to Paystack hosted page
            } else {
                setError(data.message || 'Could not initiate payment.');
            }
        } catch { setError('Connection error. Please try again.'); }
        setProcessing(false);
    };

    const handleBankTransfer = async () => {
        const token = localStorage.getItem('userToken');
        setProcessing(true); setError('');
        try {
            const res = await fetch(`${API_URL}/payment/manual/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ order_id: orderId, installment_id: null, amount: amountDue })
            });
            const data = await res.json();
            if (data.reference) {
                setBankDetails(data);
            } else {
                setError(data.message || 'Could not initiate bank transfer.');
            }
        } catch { setError('Connection error. Please try again.'); }
        setProcessing(false);
    };

    const handlePay = () => method === 'PAYSTACK' ? handlePaystack() : handleBankTransfer();

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <main className="min-h-screen bg-[#07070a] text-white relative overflow-x-hidden pb-20">
            <Navbar />

            {/* Ambient glows */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-blue-700/8 blur-[180px]" />
                <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full bg-purple-700/10 blur-[140px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-28">

                {/* Back nav */}
                <Link href="/checkout">
                    <motion.span whileHover={{ x: -4 }} className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Checkout
                    </motion.span>
                </Link>

                {/* Heading */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Payment</span>
                    </h1>
                    <p className="text-white/50">Complete your order securely below</p>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Amount due card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="glass-card rounded-3xl p-6 border border-white/8 mb-6 flex items-center justify-between shadow-2xl">
                    <div>
                        <p className="text-white/50 text-sm mb-1">{mode === 'INSTALLMENT' ? 'Deposit Due Today' : 'Total Due'}</p>
                        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            ₦{amountDue.toFixed(2)}
                        </p>
                        {mode === 'INSTALLMENT' && (
                            <p className="text-white/40 text-xs mt-1">Remaining balance: ₦{(total - deposit).toFixed(2)}</p>
                        )}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                </motion.div>

                {/* Payment Method Selection */}
                <AnimatePresence mode="wait">
                    {!bankDetails ? (
                        <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="glass-card rounded-3xl p-6 border border-white/8 shadow-2xl mb-6">
                                <h2 className="font-bold text-lg mb-5">Choose Payment Method</h2>

                                <div className="space-y-4">
                                    <MethodCard
                                        id="PAYSTACK"
                                        selected={method === 'PAYSTACK'}
                                        onSelect={() => setMethod('PAYSTACK')}
                                        icon={
                                            <div className="w-10 h-10 rounded-xl bg-[#0ba4db]/15 border border-[#0ba4db]/30 flex items-center justify-center text-xl">💳</div>
                                        }
                                        title="Pay with Paystack"
                                        subtitle="Card, bank transfer, USSD, and more — powered by Paystack"
                                        badge={<span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Instant</span>}
                                    />
                                    <MethodCard
                                        id="BANK_TRANSFER"
                                        selected={method === 'BANK_TRANSFER'}
                                        onSelect={() => setMethod('BANK_TRANSFER')}
                                        icon={
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xl">🏦</div>
                                        }
                                        title="Manual Bank Transfer"
                                        subtitle="Transfer directly to our account and receive a payment invoice by email"
                                        badge={<span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">1–2 hrs</span>}
                                    />
                                </div>
                            </motion.section>

                            {/* Pay Button */}
                            <motion.button
                                onClick={handlePay}
                                disabled={processing}
                                whileHover={{ scale: processing ? 1 : 1.02, y: processing ? 0 : -2 }}
                                whileTap={{ scale: processing ? 1 : 0.98 }}
                                className="w-full py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {processing ? <><Spinner sm /> Processing… </> : (
                                    <>
                                        {method === 'PAYSTACK' ? '⚡ Pay with Paystack' : '🏦 Get Bank Details'}
                                    </>
                                )}
                            </motion.button>

                            <p className="text-center text-white/30 text-xs mt-4 flex items-center justify-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Your payment is secured with 256-bit SSL encryption
                            </p>
                        </motion.div>
                    ) : (
                        /* Bank Transfer Details Panel */
                        <motion.div key="bank" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            <div className="glass-card rounded-3xl p-8 border border-purple-500/20 shadow-2xl shadow-purple-500/5">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-3xl">🏦</div>
                                    <div>
                                        <h2 className="text-xl font-bold">Bank Transfer Details</h2>
                                        <p className="text-white/50 text-sm">Transfer the exact amount to the account below</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-4 mb-8">
                                    <BankDetailRow label="Bank Name" value={bankDetails.bank_name} onCopy={() => copyToClipboard(bankDetails.bank_name, 'bank')} copied={copied === 'bank'} />
                                    <BankDetailRow label="Account Name" value={bankDetails.account_name} onCopy={() => copyToClipboard(bankDetails.account_name, 'name')} copied={copied === 'name'} />
                                    <BankDetailRow label="Account Number" value={bankDetails.account_number} onCopy={() => copyToClipboard(bankDetails.account_number, 'number')} copied={copied === 'number'} />
                                    <BankDetailRow label="Amount" value={`₦${Number(bankDetails.amount).toLocaleString()}`} onCopy={() => copyToClipboard(String(bankDetails.amount), 'amount')} copied={copied === 'amount'} />
                                    <BankDetailRow label="Reference" value={bankDetails.reference} onCopy={() => copyToClipboard(bankDetails.reference, 'ref')} copied={copied === 'ref'} highlight />
                                </div>

                                {/* Important note */}
                                <div className="p-4 rounded-2xl bg-yellow-500/8 border border-yellow-500/20 mb-6">
                                    <p className="text-yellow-400 text-sm font-medium">⚠️ Important</p>
                                    <p className="text-yellow-400/80 text-xs mt-1 leading-relaxed">
                                        Use the reference number as the payment narration/description when making your transfer.
                                        A payment invoice has been sent to your registered email address.
                                    </p>
                                </div>

                                <motion.button
                                    onClick={() => router.push('/marketplace')}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
                                >
                                    Done — Return to Marketplace
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
                <Spinner />
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}

/* ─── Sub-components ─── */

interface MethodCardProps {
    id: Method;
    selected: boolean;
    onSelect: () => void;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    badge: React.ReactNode;
}

function MethodCard({ selected, onSelect, icon, title, subtitle, badge }: MethodCardProps) {
    return (
        <motion.button
            onClick={onSelect}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${selected
                    ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/8 to-purple-500/8 shadow-lg shadow-blue-500/5'
                    : 'border-white/8 bg-white/3 hover:border-white/16'
                }`}
        >
            {icon}
            <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold">{title}</span>
                    {badge}
                </div>
                <p className="text-white/50 text-xs">{subtitle}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-blue-500 bg-blue-500' : 'border-white/20 bg-transparent'
                }`}>
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
        </motion.button>
    );
}

interface BankRowProps { label: string; value: string; onCopy: () => void; copied: boolean; highlight?: boolean; }
function BankDetailRow({ label, value, onCopy, copied, highlight }: BankRowProps) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${highlight ? 'border-blue-500/30 bg-blue-500/8' : 'border-white/8 bg-white/4'
            }`}>
            <div>
                <p className="text-white/50 text-xs mb-0.5">{label}</p>
                <p className={`font-semibold ${highlight ? 'text-blue-300' : 'text-white'}`}>{value}</p>
            </div>
            <motion.button onClick={onCopy} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/8 text-white/60 hover:text-white'}`}>
                {copied ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
            </motion.button>
        </div>
    );
}
