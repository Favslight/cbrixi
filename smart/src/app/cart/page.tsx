'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { formatMoney, getCartUnitPrice, hasActiveDiscount, toNumber } from '@/lib/pricing';

interface CartItem {
    id: string; // cartitem ID
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
    minimum_wallet_balance_required: number;
    stock?: number;
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();

    const fetchCartItems = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';
            const res = await fetch(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setCartItems(data.cart || []);
            } else {
                setError(data.message || 'Failed to fetch cart');
            }
        } catch {
            setError('Connection error playing cart.');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCartItems();
    }, [router]);

    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        const token = localStorage.getItem('userToken');
        setUpdatingId(itemId);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

        try {
            const res = await fetch(`${API_URL}/cart/item/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ quantity: newQuantity })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setCartItems(prev => prev.map(item =>
                        item.id === itemId ? { ...item, quantity: newQuantity } : item
                    ));
                }
            } else {
                const errorData = await res.json();
                setError(errorData.message || 'Failed to update item.');
            }
        } catch {
            setError('Could not complete update.');
        }
        setUpdatingId(null);
    };

    const readErrorMessage = async (res: Response) => {
        const data = await res.json().catch(() => ({}));
        return data.message || `Request failed: ${res.status}`;
    };

    const deleteCartItemRequest = async (id: string, token: string, API_URL: string) => {
        return fetch(`${API_URL}/cart/item/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    const handleRemoveItem = async (item: CartItem) => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const itemId = item.cart_item_id ?? item.id;
        setUpdatingId(itemId);
        setError('');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

        try {
            let res = await deleteCartItemRequest(itemId, token, API_URL);

            if (!res.ok && item.product_id && item.product_id !== itemId) {
                res = await deleteCartItemRequest(item.product_id, token, API_URL);
            }

            if (!res.ok) {
                setError(await readErrorMessage(res));
                return;
            }

            const data = await res.json().catch(() => ({ success: true }));
            if (data.success === false) {
                setError(data.message || 'Failed to remove item.');
                return;
            }

            setCartItems(prev => prev.filter(cartItem => (cartItem.cart_item_id ?? cartItem.id) !== itemId && cartItem.product_id !== item.product_id));
            fetchCartItems().catch(() => undefined);
        } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : 'Failed to remove item.');
        } finally {
            setUpdatingId(null);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => acc + (toNumber(getCartUnitPrice(item)) * item.quantity), 0);
    };

    return (
        <main className="min-h-screen bg-[#07070a] text-white flex flex-col relative z-0 pb-16">
            <Navbar />

            {/* Background elements */}
            <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Cart</span>
                    </h1>
                    <p className="text-white/50 text-lg">Review your premium tech choices</p>
                </motion.div>

                {/* Error notification */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-medium rounded-xl text-center max-w-3xl mx-auto shadow-lg shadow-red-500/5">
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center items-center py-40">
                        <svg className="w-12 h-12 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                    </div>
                ) : cartItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center p-16 glass-card rounded-3xl border border-white/10 max-w-3xl mx-auto bg-black/40 backdrop-blur-xl shadow-2xl"
                    >
                        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                        <p className="text-white/50 mb-8 max-w-md text-center">Looks like you haven&apos;t added any futuristic smart devices to your cart yet.</p>
                        <Link href="/marketplace">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25">
                                Start Shopping
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* Cart Items */}
                        <div className="flex-1 space-y-6">
                            <AnimatePresence>
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50, height: 0 }}
                                        className="glass-card bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 relative group overflow-hidden shadow-xl"
                                    >
                                        {/* Highlight accent */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative w-32 h-32 flex-shrink-0 bg-white/5 rounded-2xl flex items-center justify-center p-3">
                                            <Image src={item.image_url} alt={item.name} fill className="object-contain p-2" />
                                        </div>

                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <Link href={`/marketplace`} className="text-xl font-bold hover:text-blue-400 transition-colors">
                                                {item.name}
                                            </Link>
                                            {item.variant_name && item.variant_name !== 'Default' && (
                                                <p className="mt-1 text-sm text-blue-200">{item.variant_name}</p>
                                            )}
                                            {item.variant_specs && Object.keys(item.variant_specs).length > 0 && (
                                                <p className="mt-1 text-xs text-white/45">
                                                    {Object.entries(item.variant_specs).map(([key, value]) => `${key}: ${value}`).join(' · ')}
                                                </p>
                                            )}
                                            {item.variant_sku && <p className="mt-1 text-xs text-white/35">SKU: {item.variant_sku}</p>}
                                            <div className="mt-1">
                                                <p className="text-2xl font-semibold text-white/90">{formatMoney(getCartUnitPrice(item))}</p>
                                                {hasActiveDiscount(item) && (
                                                    <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                                                        <span className="text-sm text-white/35 line-through">{formatMoney(item.price)}</span>
                                                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                                            {Number(item.discount_percentage)}% OFF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {item.installment_enabled && (
                                                <div className="inline-flex mt-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full font-medium">
                                                    Financing available ({item.minimum_deposit_percentage}% dep.)
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                                <button
                                                    disabled={updatingId === item.id || item.quantity <= 1}
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    className="text-white/60 hover:text-white disabled:opacity-30 transition-colors w-6 h-6 flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                                                </button>

                                                <div className="w-8 text-center font-semibold text-lg relative">
                                                    {updatingId === item.id ? (
                                                        <svg className="w-4 h-4 mx-auto animate-spin text-white/50" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                        </svg>
                                                    ) : item.quantity}
                                                </div>

                                                <button
                                                    disabled={updatingId === item.id}
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="text-white/60 hover:text-white disabled:opacity-30 transition-colors w-6 h-6 flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                </button>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                disabled={updatingId === (item.cart_item_id ?? item.id)}
                                                onClick={() => handleRemoveItem(item)}
                                                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors py-1 flex items-center gap-1.5 opacity-60 group-hover:opacity-100"
                                            >
                                                {updatingId === (item.cart_item_id ?? item.id) ? (
                                                    <>
                                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                        </svg>
                                                        Removing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        Remove
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="lg:w-96 flex-shrink-0"
                        >
                            <div className="glass-card bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sticky top-28 shadow-2xl">
                                <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-white/10">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-white/70">
                                        <span>Subtotal ({cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} items)</span>
                                        <span className="text-white font-medium">{formatMoney(calculateTotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-white/70">
                                        <span>Estimated Tax</span>
                                        <span className="text-white font-medium">Calculated at checkout</span>
                                    </div>
                                    <div className="flex justify-between text-white/70 pb-4 border-b border-white/10">
                                        <span>Shipping</span>
                                        <span className="text-green-400 font-medium">Free</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-lg font-bold">Total</span>
                                        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                            {formatMoney(calculateTotal())}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={() => router.push('/checkout')}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 mb-4"
                                >
                                    Proceed to Checkout →
                                </motion.button>

                                <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Secure SSL Checkout
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </main>
    );
}
