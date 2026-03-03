'use client';

import { motion } from 'framer-motion';

interface Category {
    icon: string;
    title: string;
    description: string;
    gradient: string;
    glow: string;
}

const categories: Category[] = [
    {
        icon: '⌚',
        title: 'Smart Watches',
        description: 'Track health, fitness, and stay connected with our premium smartwatch collection.',
        gradient: 'from-blue-500/20 to-blue-900/10',
        glow: 'group-hover:shadow-blue-500/20',
    },
    {
        icon: '🏠',
        title: 'Smart Home',
        description: 'Transform your home with intelligent automation, lighting, and security systems.',
        gradient: 'from-purple-500/20 to-purple-900/10',
        glow: 'group-hover:shadow-purple-500/20',
    },
    {
        icon: '🎧',
        title: 'Audio Devices',
        description: 'Immerse yourself in studio-quality sound with wireless earbuds and speakers.',
        gradient: 'from-cyan-500/20 to-cyan-900/10',
        glow: 'group-hover:shadow-cyan-500/20',
    },
    {
        icon: '🔌',
        title: 'Accessories',
        description: 'Power banks, cables, mounts, and more — everything to complete your setup.',
        gradient: 'from-emerald-500/20 to-emerald-900/10',
        glow: 'group-hover:shadow-emerald-500/20',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.12 },
    },
};

const cardVariants: any = {
    hidden: { opacity: 0, y: 48 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
};

export default function Categories() {
    return (
        <section id="categories" className="relative py-28 overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 right-0 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-0 w-64 h-64 bg-blue-600/8 rounded-full blur-3xl" />
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
                    <span className="inline-block text-sm font-semibold tracking-widest uppercase text-blue-400 mb-3">
                        Browse by Type
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Explore Smart{' '}
                        <span className="gradient-text">Categories</span>
                    </h2>
                    <p className="text-white/50 text-lg max-w-xl mx-auto">
                        From your wrist to your living room — find the perfect smart devices tailored to your needs.
                    </p>
                </motion.div>

                {/* Cards grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {categories.map((cat) => (
                        <CategoryCard key={cat.title} category={cat} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function CategoryCard({ category }: { category: Category }) {
    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className={`group glass-card rounded-2xl p-6 cursor-pointer relative overflow-hidden shadow-xl ${category.glow} hover:shadow-2xl transition-shadow duration-500`}
        >
            {/* Gradient overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-60 rounded-2xl pointer-events-none`}
            />
            {/* Gradient border glow on hover */}
            <div className="absolute inset-0 rounded-2xl border border-white/8 group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />
            {/* Glow line top */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex flex-col gap-4">
                {/* Icon */}
                <motion.div
                    className="text-5xl w-16 h-16 flex items-center justify-center rounded-2xl bg-white/5"
                    whileHover={{ rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    {category.icon}
                </motion.div>

                <div>
                    <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-200 transition-colors">
                        {category.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">{category.description}</p>
                </div>

                {/* Arrow link */}
                <motion.div
                    className="flex items-center gap-1 text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ x: -4 }}
                    whileHover={{ x: 0 }}
                >
                    Explore{' '}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </motion.div>
            </div>
        </motion.div>
    );
}
