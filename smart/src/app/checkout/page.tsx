'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    name: string;
    price: string;
    image_url: string;
    installment_enabled: boolean;
    installment_duration_months: number;
    minimum_deposit_percentage: number;
    minimum_wallet_balance_required: number;
}

type PaymentMode = 'FULL' | 'INSTALLMENT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';

const Spinner = ({ sm }: { sm?: boolean }) => (
    <svg className={`animate-spin text-white ${sm ? 'w-4 h-4' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

export default function CheckoutPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('FULL');
    const [externalEmail, setExternalEmail] = useState('');
    const [error, setError] = useState('');

    const fetchCart = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) { router.push('/auth/login'); return; }
        try {
            const res = await fetch(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCartItems(data.cart || []);
                if (!data.cart?.length) router.push('/cart');
            } else {
                setError(data.message || 'Failed to load cart.');
            }
        } catch { setError('Connection error. Please try again.'); }
        setLoading(false);
    };

    useEffect(() => { fetchCart(); }, []);   // eslint-disable-line

    const total = cartItems.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
    const allInstallmentEnabled = cartItems.every(i => i.installment_enabled);
    const deposit = total * 0.5;

    const handlePlaceOrder = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) { router.push('/auth/login'); return; }
        
        if (paymentMode === 'INSTALLMENT' && !externalEmail) {
            setError('Please provide an email to verify your installment plan.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/order/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    payment_mode: paymentMode,
                    externalEmail: paymentMode === 'INSTALLMENT' ? externalEmail : null
                })
            });
            const data = await res.json();
            if (data.success) {
                // Pass order id to payment page
                router.push(`/payment?order_id=${data.order.order.id}&total=${total}&mode=${paymentMode}&deposit=${deposit}`);
            } else {
                setError(data.message || 'Checkout failed. Please try again.');
            }
        } catch { setError('Connection error during checkout. Please try again.'); }
        setSubmitting(false);
    };

    return (
        <main className="min-h-screen bg-[#07070a] text-white relative overflow-x-hidden pb-20">
            <Navbar />

            {/* Ambient blobs */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-purple-700/10 blur-[160px]" />
                <div className="absolute bottom-0 -left-40 w-[700px] h-[700px] rounded-full bg-blue-700/10 blur-[160px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">

                {/* Back link */}
                <Link href="/cart">
                    <motion.span whileHover={{ x: -4 }} className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Cart
                    </motion.span>
                </Link>

                {/* Heading */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Checkout</span>
                    </h1>
                    <p className="text-white/50 mt-2">Review your order and choose a payment plan</p>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-8 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
                            ⚠️ {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center py-40"><Spinner /></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                        {/* LEFT — Order Items + Payment Mode */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Step 1 – Order Items */}
                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                                className="glass-card rounded-3xl p-6 border border-white/8 shadow-2xl">
                                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">1</span>
                                    Order Items
                                </h2>
                                <ul className="space-y-4">
                                    {cartItems.map(item => (
                                        <li key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/4 border border-white/6 hover:border-white/12 transition-colors">
                                            <div className="relative w-14 h-14 flex-shrink-0 rounded-xl bg-white/5 p-1 overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{item.name}</p>
                                                <p className="text-white/50 text-sm">Qty: {item.quantity}</p>
                                                {item.installment_enabled && (
                                                    <span className="inline-block mt-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                                                        Instalment eligible
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-bold text-white whitespace-nowrap">₦{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                        </li>
                                    ))}
                                </ul>
                            </motion.section>

                            {/* Step 2 – Payment Mode */}
                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                                className="glass-card rounded-3xl p-6 border border-white/8 shadow-2xl">
                                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">2</span>
                                    Payment Plan
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Full Payment */}
                                    <PaymentModeCard
                                        id="FULL"
                                        selected={paymentMode === 'FULL'}
                                        onSelect={() => setPaymentMode('FULL')}
                                        icon={
                                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        }
                                        title="Pay in Full"
                                        description="Pay the entire amount upfront — no interest, no commitments."
                                        badge={<span className="text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs">Recommended</span>}
                                        amount={`₦${total.toFixed(2)}`}
                                    />

                                    {/* Installment */}
                                    <PaymentModeCard
                                        id="INSTALLMENT"
                                        selected={paymentMode === 'INSTALLMENT'}
                                        onSelect={() => setPaymentMode('INSTALLMENT')}
                                        disabled={!allInstallmentEnabled}
                                        disabledReason="One or more items are not eligible for installment plans."
                                        icon={
                                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        }
                                        title="Pay in Instalments"
                                        description="Split your purchase into manageable monthly payments."
                                        badge={<span className="text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full text-xs">Flexible</span>}
                                        amount={`₦${deposit.toFixed(2)} deposit`}
                                    />
                                </div>
                                {paymentMode === 'INSTALLMENT' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6">
                                        <label className="block text-sm font-medium text-white/70 mb-2">Verify Email for Installment</label>
                                        <input 
                                            type="email" 
                                            value={externalEmail} 
                                            onChange={(e) => setExternalEmail(e.target.value)} 
                                            placeholder="Enter your email address to verify" 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </motion.div>
                                )}
                            </motion.section>
                        </div>

                        {/* RIGHT – Summary */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="lg:col-span-2">
                            <div className="glass-card rounded-3xl p-8 border border-white/8 shadow-2xl sticky top-28">
                                <h2 className="text-xl font-bold mb-6 pb-4 border-b border-white/10">Order Summary</h2>

                                <div className="space-y-4 text-sm mb-6">
                                    <Row label={`Subtotal (${cartItems.reduce((a, i) => a + i.quantity, 0)} items)`} value={`₦${total.toFixed(2)}`} />
                                    <Row label="Shipping" value="Free" valueClass="text-green-400" />
                                    {paymentMode === 'INSTALLMENT' && (
                                        <>
                                            <Row label="Deposit (50%)" value={`₦${deposit.toFixed(2)}`} />
                                            <Row label="Remaining balance" value={`₦${(total - deposit).toFixed(2)}`} valueClass="text-white/50" />
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-between items-center mb-8 pt-4 border-t border-white/10">
                                    <span className="text-base font-bold">{paymentMode === 'INSTALLMENT' ? 'Due Today' : 'Total Due'}</span>
                                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                        ₦{paymentMode === 'INSTALLMENT' ? deposit.toFixed(2) : total.toFixed(2)}
                                    </span>
                                </div>

                                <motion.button
                                    onClick={handlePlaceOrder}
                                    disabled={submitting}
                                    whileHover={{ scale: submitting ? 1 : 1.02, y: submitting ? 0 : -2 }}
                                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <><Spinner sm /> Processing…</> : '🔒 Place Order'}
                                </motion.button>

                                <p className="text-center text-white/30 text-xs mt-4">
                                    By placing your order you agree to our Terms &amp; Privacy Policy
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </main>
    );
}

/* ─── Sub-components ─── */

function Row({ label, value, valueClass = 'text-white font-medium' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between text-white/60">
            <span>{label}</span>
            <span className={valueClass}>{value}</span>
        </div>
    );
}

interface ModeCardProps {
    id: PaymentMode;
    selected: boolean;
    onSelect: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    badge: React.ReactNode;
    amount: string;
    disabled?: boolean;
    disabledReason?: string;
}

function PaymentModeCard({ id, selected, onSelect, icon, title, description, badge, amount, disabled, disabledReason }: ModeCardProps) {
    return (
        <motion.button
            onClick={disabled ? undefined : onSelect}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 focus:outline-none ${disabled
                    ? 'border-white/5 bg-white/2 opacity-40 cursor-not-allowed'
                    : selected
                        ? 'border-blue-500/60 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shadow-lg shadow-blue-500/10'
                        : 'border-white/10 bg-white/4 hover:border-white/20'
                }`}
        >
            {/* Selected ring indicator */}
            {selected && !disabled && (
                <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </span>
            )}

            <div className={`mb-3 ${selected && !disabled ? 'text-blue-400' : 'text-white/50'}`}>{icon}</div>
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base">{title}</h3>
                {badge}
            </div>
            <p className="text-white/50 text-xs mb-3 leading-relaxed">{disabled ? disabledReason : description}</p>
            <p className={`font-bold text-lg ${selected && !disabled ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' : 'text-white/80'}`}>{amount}</p>
        </motion.button>
    );
}
