'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Category {
  image: string;
  title: string;
  description: string;
  gradient: string;
  glow: string;
}

const categories: Category[] = [
  {
    image: '/images/cat-smartwatch.png',
    title: 'Smart Watches',
    description: 'Track health, fitness, and stay connected with our premium smartwatch collection.',
    gradient: 'from-blue-500/25 to-blue-900/20',
    glow: 'group-hover:shadow-blue-500/20',
  },
  {
    image: '/images/cat-smarthome.png',
    title: 'Smart Home',
    description: 'Transform your home with intelligent automation, lighting, and security systems.',
    gradient: 'from-purple-500/25 to-purple-900/20',
    glow: 'group-hover:shadow-purple-500/20',
  },
  {
    image: '/images/cat-audio.png',
    title: 'Audio Devices',
    description: 'Immerse yourself in studio-quality sound with wireless earbuds and speakers.',
    gradient: 'from-cyan-500/25 to-cyan-900/20',
    glow: 'group-hover:shadow-cyan-500/20',
  },
  {
    image: '/images/cat-accessories.png',
    title: 'Accessories',
    description: 'Power banks, cables, mounts, and more - everything to complete your setup.',
    gradient: 'from-emerald-500/25 to-emerald-900/20',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    image: '/images/smartphone.png',
    title: 'Smart Phones',
    description: 'Flagship and mid-range smartphones with excellent battery life and camera performance.',
    gradient: 'from-fuchsia-500/25 to-fuchsia-900/20',
    glow: 'group-hover:shadow-fuchsia-500/20',
  },
  {
    image: '/images/cat-vehicles.jpeg',
    title: 'Vehicles',
    description: 'Smart mobility options and connected transport accessories for modern commuters.',
    gradient: 'from-orange-500/25 to-orange-900/20',
    glow: 'group-hover:shadow-orange-500/20',
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

const SLUG_MAP: Record<string, string> = {
  'Smart Watches': 'smart-watches',
  'Smart Home': 'smart-home',
  'Audio Devices': 'audio-devices',
  'Accessories': 'accessories',
  'Smart Phones': 'smart-phones',
  'Vehicles': 'vehicles',
};

export default function Categories() {
  return (
    <section id="categories" className="relative py-28 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-64 h-64 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Explore Smart <span className="gradient-text">Categories</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            From your wrist to your living room - find the perfect smart devices tailored to your needs.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
  const slug = SLUG_MAP[category.title] || 'marketplace';
  return (
    <Link href={`/marketplace/${slug}`} className="block">
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className={`group glass-card rounded-2xl p-6 cursor-pointer relative overflow-hidden shadow-xl ${category.glow} hover:shadow-2xl transition-shadow duration-500 min-h-[220px]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.image}
          alt={category.title}
          className="absolute inset-0 h-full w-full object-cover opacity-35 group-hover:opacity-45 transition-opacity duration-300"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-75 rounded-2xl pointer-events-none`} />
        <div className="absolute inset-0 rounded-2xl border border-white/8 group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col justify-end gap-3">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-200 transition-colors">
              {category.title}
            </h3>
            <p className="text-white/75 text-sm leading-relaxed">{category.description}</p>
          </div>

          <motion.div className="flex items-center gap-1 text-blue-200 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Explore</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
