'use client';

import { motion } from 'framer-motion';

interface Feature {
    icon: string;
    title: string;
    description: string;
    accentColor: string;
    glowColor: string;
}

const features: Feature[] = [
    {
        icon: '🚀',
        title: 'Fast Delivery',
        description:
            'Get your smart devices delivered to your door in record time. Same-day and next-day options available.',
        accentColor: 'from-blue-500 to-blue-600',
        glowColor: 'group-hover:shadow-blue-500/30',
    },
    {
        icon: '🔒',
        title: 'Secure Payments',
        description:
            'Shop with full confidence. Every transaction is encrypted and protected with bank-grade security.',
        accentColor: 'from-purple-500 to-purple-600',
        glowColor: 'group-hover:shadow-purple-500/30',
    },
    {
        icon: '💡',
        title: 'Latest Technology',
        description:
            'We partner with leading brands to bring you the most cutting-edge smart devices on the market.',
        accentColor: 'from-cyan-500 to-cyan-600',
        glowColor: 'group-hover:shadow-cyan-500/30',
    },
];

export default function WhyChoose() {
    return (
        <section id="why-choose" className="relative py-28 overflow-hidden">
            {/* Divider line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Background glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 left-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-16"
                >
                    <span className="inline-block text-sm font-semibold tracking-widest uppercase text-purple-400 mb-3">
                        Our Promise
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Why Choose{' '}
                        <span className="gradient-text">CBRIXI?</span>
                    </h2>
                    <p className="text-white/50 text-lg max-w-xl mx-auto">
                        We&apos;re committed to delivering the best tech experience — from browsing to unboxing and beyond.
                    </p>
                </motion.div>

                {/* Continuous marquee */}
                <div className="relative overflow-hidden">
                    <motion.div
                        className="flex gap-6 w-max"
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                    >
                        {[...features, ...features].map((feature, index) => (
                            <FeatureCard key={`${feature.title}-${index}`} feature={feature} />
                        ))}
                    </motion.div>
                </div>

                {/* CTA banner */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-20 relative rounded-3xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 backdrop-blur-sm" />
                    <div className="absolute inset-0 border border-white/10 rounded-3xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-10">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                                Ready to go smarter?
                            </h3>
                            <p className="text-white/50">
                                Join 10,000+ happy customers who trust CBRIXI for their smart devices.
                            </p>
                        </div>
                        <motion.a
                            href="#shop"
                            whileHover={{ y: -3, scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex-shrink-0 px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 glow-blue hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
                        >
                            Start Shopping →
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`group glass-card rounded-2xl p-8 relative overflow-hidden shadow-xl hover:shadow-2xl ${feature.glowColor} transition-all duration-500 w-[320px] sm:w-[360px] flex-shrink-0`}
        >
            {/* Top glow accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon */}
            <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accentColor} flex items-center justify-center text-3xl mb-6 shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
                {feature.icon}
            </motion.div>

            <h3 className="text-white text-xl font-bold mb-3 group-hover:gradient-text transition-all duration-300">
                {feature.title}
            </h3>
            <p className="text-white/50 leading-relaxed text-sm">{feature.description}</p>

            {/* Bottom sparkle */}
            <div
                className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl ${feature.accentColor} opacity-10 rounded-full blur-2xl pointer-events-none group-hover:opacity-20 transition-opacity duration-500`}
            />
        </motion.div>
    );
}
