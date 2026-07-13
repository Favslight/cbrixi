'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { formatMoney, getCartUnitPrice, hasActiveDiscount, toNumber } from '@/lib/pricing';

interface CartItem {
    id?: string;
    cart_item_id?: string;
    product_id: string;
    variant_id?: string;
    variant_name?: string;
    variant_specs?: Record<string, string | number | boolean>;
    variant_sku?: string | null;
    quantity: number;
    name: string;
    price: string | number;
    discount_enabled?: boolean;
    discount_percentage?: string | number;
    discount_amount?: string | number;
    discounted_price?: string | number;
    effective_price?: string | number;
    image_url: string;
    installment_enabled: boolean;
    installment_duration_months: number;
    minimum_deposit_percentage: number;
}

interface UserProfile {
    cbrilliance_email?: string | null;
    cbrilliance_email_verified?: boolean;
    cbrilliance_email_verified_at?: string | null;
}

type PaymentMode = 'FULL' | 'INSTALLMENT';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');
    const [pendingInstallmentOrder, setPendingInstallmentOrder] = useState<{
        id: string;
        external_email?: string;
        total_amount?: string | number;
        deposit_amount?: string | number;
        remaining_amount?: string | number;
        requires_approval?: boolean;
    } | null>(null);

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

            try {
                const profileRes = await fetch(`${API_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    const user = profileData.user ?? profileData;
                    setUserProfile(user);
                    if (user?.cbrilliance_email_verified && user?.cbrilliance_email) {
                        setExternalEmail(String(user.cbrilliance_email));
                    }
                }
            } catch {
                setUserProfile(null);
            }
        } catch { setError('Connection error. Please try again.'); }
        setLoading(false);
    };

    useEffect(() => { fetchCart(); }, []);   // eslint-disable-line

    const total = cartItems.reduce((acc, i) => acc + toNumber(getCartUnitPrice(i)) * i.quantity, 0);
    const allInstallmentEnabled = cartItems.every(i => i.installment_enabled);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cbrillianceVerified = userProfile?.cbrilliance_email_verified === true;

    const handlePlaceOrder = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) { router.push('/auth/login'); return; }
        
        const trimmedExternalEmail = externalEmail.trim();

        if (paymentMode === 'INSTALLMENT' && !cbrillianceVerified && !trimmedExternalEmail) {
            setError('Please provide your Cbrilliance email for installment approval.');
            return;
        }

        if (paymentMode === 'INSTALLMENT' && !cbrillianceVerified && !emailPattern.test(trimmedExternalEmail)) {
            setError('Please provide a valid Cbrilliance email address.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const payload: { payment_mode: PaymentMode; externalEmail?: string } = {
                payment_mode: paymentMode,
            };
            if (paymentMode === 'INSTALLMENT' && !cbrillianceVerified) {
                payload.externalEmail = trimmedExternalEmail;
            }

            const res = await fetch(`${API_URL}/order/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                const order = data.order?.order ?? data.order;
                const summary = data.payment_summary;

                // Backend clears cart after checkout — reset local state
                setCartItems([]);

                if (paymentMode === 'INSTALLMENT') {
                    setPendingInstallmentOrder({
                        id: order?.id ?? '',
                        external_email: order?.external_email ?? trimmedExternalEmail,
                        total_amount: summary?.total_amount ?? order?.total_amount,
                        deposit_amount: summary?.deposit_amount ?? order?.deposit_amount,
                        remaining_amount: summary?.remaining_amount ?? order?.remaining_amount ?? order?.remaining_balance,
                        requires_approval: !cbrillianceVerified && order?.status === 'AWAITING_APPROVAL',
                    });
                    setSubmitting(false);
                    return;
                }

                const paymentTotal = summary?.total_amount ?? order?.total_amount ?? total;
                router.push(`/payment?order_id=${order?.id}&total=${encodeURIComponent(String(paymentTotal))}&mode=${paymentMode}`);
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

                {pendingInstallmentOrder ? (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl glass-card rounded-3xl p-8 border border-emerald-500/20 shadow-2xl bg-emerald-500/5"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-6">
                            <svg className="w-7 h-7 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-3">
                            {pendingInstallmentOrder.requires_approval ? 'Installment request pending admin approval' : 'Installment order created'}
                        </h2>
                        <p className="text-white/60 leading-relaxed mb-6">
                            {pendingInstallmentOrder.requires_approval
                                ? `Your order has been submitted with ${pendingInstallmentOrder.external_email}. Payment will be enabled on your dashboard after admin approval.`
                                : 'Your Cbrilliance email is already verified. Go to your orders dashboard to start the first-deposit bank payment.'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                            <SummaryPill label="Total" value={fmtMoney(pendingInstallmentOrder.total_amount ?? total)} />
                            <SummaryPill label="Required deposit" value={fmtMoney(pendingInstallmentOrder.deposit_amount ?? 0)} />
                            <SummaryPill label="Remaining" value={fmtMoney(pendingInstallmentOrder.remaining_amount ?? 0)} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/orders" className="inline-flex justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 font-bold text-white">
                                View orders
                            </Link>
                            <Link href="/marketplace" className="inline-flex justify-center rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/70 hover:text-white">
                                Continue shopping
                            </Link>
                        </div>
                    </motion.section>
                ) : loading ? (
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
                                        <li key={item.cart_item_id ?? item.id ?? `${item.product_id}-${item.variant_id ?? 'default'}`} className="flex items-center gap-4 p-3 rounded-2xl bg-white/4 border border-white/6 hover:border-white/12 transition-colors">
                                            <div className="relative w-14 h-14 flex-shrink-0 rounded-xl bg-white/5 p-1 overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{item.name}</p>
                                                {item.variant_name && item.variant_name !== 'Default' && (
                                                    <p className="text-blue-200 text-sm truncate">{item.variant_name}</p>
                                                )}
                                                {item.variant_specs && Object.keys(item.variant_specs).length > 0 && (
                                                    <p className="text-white/45 text-xs truncate">
                                                        {Object.entries(item.variant_specs).map(([key, value]) => `${key}: ${value}`).join(' · ')}
                                                    </p>
                                                )}
                                                {item.variant_sku && <p className="text-white/35 text-xs truncate">SKU: {item.variant_sku}</p>}
                                                <p className="text-white/50 text-sm">Qty: {item.quantity}</p>
                                                {item.installment_enabled && (
                                                    <span className="inline-block mt-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                                                        Instalment eligible
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <p className="font-bold text-white">{formatMoney(toNumber(getCartUnitPrice(item)) * item.quantity)}</p>
                                                {hasActiveDiscount(item) && (
                                                    <p className="mt-1 text-xs text-white/35">
                                                        <span className="line-through">{formatMoney(toNumber(item.price) * item.quantity)}</span>
                                                        <span className="ml-2 text-emerald-300">{Number(item.discount_percentage)}% OFF</span>
                                                    </p>
                                                )}
                                            </div>
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
                                        amount={formatMoney(total)}
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
                                        description={cbrillianceVerified ? 'Your Cbrilliance email is verified. Continue from Orders after checkout.' : 'Submit your Cbrilliance email for admin approval before payment.'}
                                        badge={<span className="text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full text-xs">Flexible</span>}
                                        amount={cbrillianceVerified ? 'Verified' : 'Approval required'}
                                    />
                                </div>
                                {paymentMode === 'INSTALLMENT' && cbrillianceVerified && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                        <p className="text-sm font-semibold text-emerald-200">Cbrilliance email verified</p>
                                        {userProfile?.cbrilliance_email && (
                                            <p className="text-xs text-emerald-100/70 mt-1 break-all">{userProfile.cbrilliance_email}</p>
                                        )}
                                        <p className="text-xs text-emerald-100/70 mt-2">The checkout will use your saved verified email. No new approval email is required.</p>
                                    </motion.div>
                                )}
                                {paymentMode === 'INSTALLMENT' && !cbrillianceVerified && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6">
                                        <label className="block text-sm font-medium text-white/70 mb-2">Cbrilliance email for approval</label>
                                        <input 
                                            type="email" 
                                            value={externalEmail} 
                                            onChange={(e) => setExternalEmail(e.target.value)} 
                                            placeholder="user@cbrilliance.io" 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                        <p className="text-white/40 text-xs mt-2">No payment details are needed until your request is approved.</p>
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
                                    <Row label={`Subtotal (${cartItems.reduce((a, i) => a + i.quantity, 0)} items)`} value={formatMoney(total)} />
                                    <Row label="Shipping" value="Free" valueClass="text-green-400" />
                                    {paymentMode === 'INSTALLMENT' && (
                                        <>
                                            <Row label="Approval status" value={cbrillianceVerified ? 'Verified account' : 'Pending review after checkout'} valueClass={cbrillianceVerified ? 'text-emerald-300' : 'text-yellow-300'} />
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-between items-center mb-8 pt-4 border-t border-white/10">
                                    <span className="text-base font-bold">{paymentMode === 'INSTALLMENT' ? 'Payment due now' : 'Total Due'}</span>
                                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                        {paymentMode === 'INSTALLMENT' ? formatMoney(0) : formatMoney(total)}
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

function fmtMoney(value: string | number) {
    return `N${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-white/45 text-xs mb-1">{label}</p>
            <p className="text-white font-bold tabular-nums">{value}</p>
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
