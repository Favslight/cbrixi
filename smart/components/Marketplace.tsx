'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/productsStore';

import { useRouter } from 'next/navigation';

export default function Marketplace() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';
        fetch(`${API_URL}/products`)
            .then((res) => res.json())
            .then((data) => {
                setProducts(data.products || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    // Lock scroll when modal is open
    useEffect(() => {
        if (selectedProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [selectedProduct]);

    return (
        <section id="marketplace" className="relative py-28 overflow-hidden bg-[#07070a]">
            {/* Background accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-40 -left-64 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-40 -right-64 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-16"
                >
                    <span className="inline-block text-sm font-semibold tracking-widest uppercase text-purple-400 mb-3">
                        Shop By Product
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        The <span className="gradient-text">Marketplace</span>
                    </h2>
                    <p className="text-white/50 text-lg max-w-xl mx-auto">
                        Explore our full catalog of premium smart devices, engineered for the future.
                    </p>
                </motion.div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                onClick={() => setSelectedProduct(product)}
                                className="group rounded-3xl cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-xl hover:shadow-2xl transition-all duration-500 h-[400px]"
                            >
                                {/* Product Image Cover */}
                                <div className="absolute inset-0 z-0">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>

                                {/* Card Background Gradient & Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-500`} />

                                {/* Card Inner Border */}
                                <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-white/30 z-20 transition-colors duration-500 pointer-events-none" />

                                {/* Product Info placed at bottom */}
                                <div className="relative z-30 mt-auto p-6 w-full flex flex-col items-start text-left">
                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                                        {product.name}
                                    </h3>
                                    <p className="text-xl font-semibold text-white/90">{product.price}</p>

                                    {/* View Details Label */}
                                    <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none text-sm text-blue-400 font-medium">
                                        View Details →
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        {/* Modal Backdrop (Blurred) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col shadow-black/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="flex flex-col sm:flex-row w-full">
                                {/* Left: Image */}
                                <div className={`relative flex-shrink-0 h-72 sm:h-auto sm:w-1/2 bg-gradient-to-br ${selectedProduct.gradient} flex items-center justify-center p-8`}>
                                    <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="relative w-full h-full drop-shadow-2xl z-10"
                                    >
                                        <Image
                                            src={selectedProduct.image}
                                            alt={selectedProduct.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </motion.div>
                                </div>

                                {/* Right: Product Details on White space */}
                                <div className="p-8 flex flex-col justify-center bg-white text-gray-900 sm:w-1/2">
                                    <motion.div
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-3xl font-bold text-gray-900 leading-tight pr-4">
                                                {selectedProduct.name}
                                            </h2>
                                            <p className="text-2xl font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl whitespace-nowrap">
                                                {selectedProduct.price}
                                            </p>
                                        </div>

                                        <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6" />

                                        <p className="text-gray-600 text-base leading-relaxed mb-8">
                                            {selectedProduct.description}
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={async (e) => {
                                                    const btn = e.currentTarget;
                                                    const originalText = btn.innerHTML;
                                                    btn.innerHTML = 'Adding...';
                                                    btn.disabled = true;
                                                    try {
                                                        const token = localStorage.getItem('userToken');
                                                        if (!token) {
                                                            router.push('/auth/login');
                                                            return;
                                                        }
                                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cbrixiserver.onrender.com';
                                                        await fetch(`${API_URL}/cart/add`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                            body: JSON.stringify({ product_id: selectedProduct.id, quantity: 1 })
                                                        });
                                                        btn.innerHTML = 'Added! ✓';
                                                        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
                                                    } catch {
                                                        btn.innerHTML = 'Error';
                                                        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
                                                    }
                                                }}
                                                className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-gray-900 hover:bg-black hover:shadow-xl transition-all active:scale-95 text-center flex justify-center items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 6H3m4 7a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
                                                </svg>
                                                Add to Cart
                                            </button>
                                            <button className="py-4 px-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 transition-all active:scale-95">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
