'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Sample product data
const products = [
    {
        id: 1,
        name: 'CBRIXI Smartwatch Series X',
        price: '$299',
        description: 'Track your health, fitness, and stay connected with our premium smartwatch. Features include a brilliantly bright OLED display, always-on tracking, and an impressive multi-day battery life.',
        image: '/images/smartwatch.png',
        gradient: 'from-blue-500/20 to-purple-500/20',
    },
    {
        id: 2,
        name: 'CBRIXI Pro Earbuds',
        price: '$149',
        description: 'Immerse yourself in studio-quality sound with cutting-edge active noise cancellation, custom acoustic tuning, and a seamless zero-delay connection.',
        image: '/images/earbuds.png',
        gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
        id: 3,
        name: 'CBRIXI AI Glasses',
        price: '$499',
        description: 'The ultimate wearable augmented reality. Stay focused with an integrated heads-up display and an integrated AI assistant that anticipates your every need.',
        image: '/images/glasses.png',
        gradient: 'from-cyan-500/20 to-blue-500/20',
    },
    {
        id: 4,
        name: 'CBRIXI Vision Laptop',
        price: '$1299',
        description: 'Unleash your creativity. Featuring a state-of-the-art neural processor, this laptop is designed for maximum performance, minimal weight, and an astonishing display.',
        image: '/images/laptop.png',
        gradient: 'from-emerald-500/20 to-cyan-500/20',
    },
    {
        id: 5,
        name: 'CBRIXI Smart Phone Z',
        price: '$899',
        description: 'Capture the impossible with a professional-grade multi-lens camera system, and power through your day with an ultra-efficient next-generation chipset.',
        image: '/images/smartphone.png',
        gradient: 'from-orange-500/20 to-red-500/20',
    },
    {
        id: 6,
        name: 'CBRIXI Home Speaker',
        price: '$199',
        description: 'Room-filling spatial audio that adapts to your environment. Equipped with an incredibly responsive voice assistant built right in for total home control.',
        image: '/images/speaker.png',
        gradient: 'from-fuchsia-500/20 to-purple-500/20',
    },
];

export default function Marketplace() {
    const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);

    // Lock scroll when modal is open
    if (typeof window !== 'undefined') {
        if (selectedProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }

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

                            {/* Top Side: Product Image Cover */}
                            <div className={`relative h-72 w-full bg-gradient-to-br ${selectedProduct.gradient} flex items-center justify-center p-8`}>
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

                            {/* Bottom Side: Product Details on White space */}
                            <div className="p-8 flex flex-col justify-center bg-white text-gray-900">
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
                                        <button className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-gray-900 hover:bg-black hover:shadow-xl transition-all active:scale-95 text-center flex justify-center items-center gap-2">
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
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
