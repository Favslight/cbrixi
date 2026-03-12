'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ─── Per-category data ─────────────────────────────────── */
const CATEGORIES: Record<string, {
  title: string;
  tagline: string;
  image: string;
  accent: string;          // tailwind colour token (blue/purple/cyan/emerald)
  accentHex: string;       // raw hex for glow/border
  gradient: string;        // card gradient classes
  icon: string;
  intro: string;
  sections: { heading: string; body: string }[];
  features: { icon: string; label: string }[];
}> = {
  'smart-watches': {
    title: 'Smart Watches',
    tagline: 'Your wrist. Upgraded.',
    image: '/images/cat-smartwatch.png',
    accent: 'blue',
    accentHex: '#3b82f6',
    gradient: 'from-blue-600/30 via-blue-900/10 to-transparent',
    icon: '⌚',
    intro:
      'Smart watches are no longer just time-tellers — they are your health coach, fitness partner, and communication hub, all wrapped around your wrist. CBRIXI brings you the finest collection of precision-engineered smartwatches designed for every lifestyle.',
    sections: [
      {
        heading: 'Health at a Glance',
        body: 'Monitor your heart rate, blood oxygen, sleep quality, and stress levels in real time. Our smartwatches sync seamlessly with your phone to give you actionable insights about your body — helping you train smarter, sleep better, and live longer.',
      },
      {
        heading: 'Stay Connected, Hands-Free',
        body: 'Receive calls, reply to messages, and get app notifications without ever reaching for your phone. With built-in GPS and LTE options, you stay wired to what matters — whether you\'re on a run, in a meeting, or across the world.',
      },
      {
        heading: 'Style Meets Engineering',
        body: 'From sporty silicone straps to premium stainless-steel finishes, our smartwatches combine cutting-edge technology with timeless aesthetics. Swap bands in seconds to match your outfit, mood, or occasion.',
      },
    ],
    features: [
      { icon: '❤️', label: 'Heart-Rate & SpO₂ Monitor' },
      { icon: '🛰️', label: 'Built-in GPS' },
      { icon: '💤', label: 'Sleep Tracking' },
      { icon: '🔋', label: 'Up to 14-Day Battery' },
      { icon: '💧', label: '5ATM Water Resistance' },
      { icon: '📲', label: 'iOS & Android Ready' },
    ],
  },

  'smart-home': {
    title: 'Smart Home',
    tagline: 'Your home. Intelligent.',
    image: '/images/cat-smarthome.png',
    accent: 'purple',
    accentHex: '#a855f7',
    gradient: 'from-purple-600/30 via-purple-900/10 to-transparent',
    icon: '🏠',
    intro:
      'A smart home isn\'t just convenient — it\'s a statement. CBRIXI\'s smart home collection puts you in control of every light, lock, camera, and appliance in your space, from anywhere in the world with just a tap or a voice command.',
    sections: [
      {
        heading: 'Automate Your Day',
        body: 'Set routines that match your lifestyle. "Good Morning" can raise your blinds, brew your coffee, and give you a weather briefing — all without touching a button. "Good Night" locks the doors, dims the lights, and arms the alarm automatically.',
      },
      {
        heading: 'Total Security & Peace of Mind',
        body: 'Monitor your home 24/7 with HD smart cameras offering night vision and motion alerts. Smart locks let you grant access remotely, check who came and went, and lock up from your phone — even when you\'re miles away.',
      },
      {
        heading: 'Energy-Efficient Living',
        body: 'Smart thermostats learn your preferences and optimise energy usage, reducing utility bills by up to 30%. Smart plugs let you cut standby power with a tap. Save money while saving the planet.',
      },
    ],
    features: [
      { icon: '💡', label: 'Smart Lighting Control' },
      { icon: '🔐', label: 'Remote Lock & Access' },
      { icon: '📷', label: 'HD Security Cameras' },
      { icon: '🌡️', label: 'Smart Thermostat' },
      { icon: '🗣️', label: 'Voice Assistant Compatible' },
      { icon: '⚡', label: 'Energy Usage Dashboard' },
    ],
  },

  'audio-devices': {
    title: 'Audio Devices',
    tagline: 'Hear everything. Miss nothing.',
    image: '/images/cat-audio.png',
    accent: 'cyan',
    accentHex: '#06b6d4',
    gradient: 'from-cyan-600/30 via-cyan-900/10 to-transparent',
    icon: '🎧',
    intro:
      'Music, podcasts, calls, games — sound is at the heart of every moment. CBRIXI\'s audio lineup delivers studio-grade fidelity in devices built for the real world: portable, durable, and stunning to listen to.',
    sections: [
      {
        heading: 'Immersive Sound, Zero Compromise',
        body: 'Our premium earbuds and headphones use advanced driver technology and custom tuning to reproduce every frequency with breathtaking clarity. Whether you prefer deep bass or crisp highs, find your perfect sound profile.',
      },
      {
        heading: 'Active Noise Cancellation',
        body: 'Block out the world and dive into your music. Our ANC technology analyses environmental noise up to 4,000 times per second and issues an equal anti-noise signal — giving you a bubble of pure audio wherever you are.',
      },
      {
        heading: 'All-Day Wear, All-Day Power',
        body: 'Ergonomic designs with premium materials mean hours of comfortable wear without fatigue. Combined with fast-charging cases that extend your listening to over 40 hours total, your audio never has to stop.',
      },
    ],
    features: [
      { icon: '🎵', label: 'Hi-Res Audio Certified' },
      { icon: '🔇', label: 'Hybrid Active Noise Cancellation' },
      { icon: '⏱️', label: '40+ Hour Total Battery' },
      { icon: '⚡', label: '10-Min Quick Charge' },
      { icon: '📡', label: 'Bluetooth 5.3' },
      { icon: '🌬️', label: 'Wind-Noise Reduction Mics' },
    ],
  },

  'accessories': {
    title: 'Accessories',
    tagline: 'Complete your setup.',
    image: '/images/cat-accessories.png',
    accent: 'emerald',
    accentHex: '#10b981',
    gradient: 'from-emerald-600/30 via-emerald-900/10 to-transparent',
    icon: '🔌',
    intro:
      'The right accessories transform a good device into a great experience. From ultra-fast chargers to sleek protective cases, CBRIXI\'s accessory line is built to complement your tech and simplify your life.',
    sections: [
      {
        heading: 'Power Without Limits',
        body: 'Our power banks pack massive capacity into slim, lightweight bodies. With up to 65W Power Delivery, charge your laptop, phone, and earbuds simultaneously. Never hunt for a wall socket again — carry a power station in your pocket.',
      },
      {
        heading: 'Protect What Matters',
        body: 'Military-grade cases, screen protectors, and anti-drop sleeves shield your devices from real-world hazards. Thoughtfully designed to add grip and style without adding bulk — your device looks great and stays safe.',
      },
      {
        heading: 'Cables Built to Last',
        body: 'Braided, tangle-resistant cables with reinforced connectors rated for 30,000+ bends. USB-C to USB-C, Lightning, and multi-tip options ensure every device in your life charges fast and stays charged.',
      },
    ],
    features: [
      { icon: '⚡', label: '65W GaN Fast Charging' },
      { icon: '🔋', label: '20,000 mAh Power Banks' },
      { icon: '🛡️', label: 'Military-Grade Protection' },
      { icon: '🔗', label: 'Braided Durable Cables' },
      { icon: '📱', label: 'Universal Compatibility' },
      { icon: '🌀', label: 'Wireless Charging Pads' },
    ],
  },
};

/* ─── Accent helpers ────────────────────────────────────── */
const accentClasses: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  blue:    { text: 'text-blue-400',    border: 'border-blue-500/40',   bg: 'bg-blue-500/10',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  purple:  { text: 'text-purple-400',  border: 'border-purple-500/40', bg: 'bg-purple-500/10',  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  cyan:    { text: 'text-cyan-400',    border: 'border-cyan-500/40',   bg: 'bg-cyan-500/10',    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/40',bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

/* ─── Page ──────────────────────────────────────────────── */
export default function CategoryPage() {
  const params = useParams();
  const slug = typeof params?.category === 'string' ? params.category : '';
  const data = CATEGORIES[slug];
  const ac = data ? accentClasses[data.accent] : null;

  /* Scroll to top on mount */
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [slug]);

  /* ── 404 state ── */
  if (!data || !ac) {
    return (
      <main className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center gap-6 p-8">
        <p className="text-6xl">🔍</p>
        <h1 className="text-3xl font-bold text-white">Category not found</h1>
        <p className="text-white/50">The category &ldquo;{slug}&rdquo; doesn&apos;t exist yet.</p>
        <Link href="/" className="mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors">
          ← Back Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-white overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">

        {/* Layered background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] opacity-20"
            style={{ background: data.accentHex }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07070a]/50 to-[#07070a]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24">

          {/* Left: Text */}
          <div>
            {/* Back link */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/#categories"
                className={`inline-flex items-center gap-2 text-sm font-medium ${ac.text} mb-8 group`}
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                All Categories
              </Link>
            </motion.div>

            {/* Tag */}
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase mb-6 ${ac.badge}`}
            >
              <span>{data.icon}</span>
              {data.title}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.07] tracking-tight mb-6"
            >
              {data.tagline.split(' ').map((word, i) => (
                <span key={i}>
                  {i === data.tagline.split(' ').length - 1
                    ? <span className="gradient-text">{word}</span>
                    : <>{word}{' '}</>}
                </span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18 }}
              className="text-white/60 text-lg leading-relaxed max-w-xl mb-10"
            >
              {data.intro}
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/marketplace">
                <motion.span
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  Shop Now
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </motion.span>
              </Link>
              <Link href="/#categories">
                <motion.span
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border ${ac.border} ${ac.text} cursor-pointer glass-card`}
                >
                  Browse Categories
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Right: Floating image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Glow ring */}
              <div
                className="absolute inset-10 rounded-full blur-3xl opacity-30"
                style={{ background: data.accentHex }}
              />
              {/* Floating device */}
              <motion.div
                animate={{
                  y: [0, -18, 0, 18, 0],
                  rotate: [0, 2, 0, -2, 0],
                  scale: [1, 1.02, 1, 1.02, 1],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full h-full flex items-center justify-center drop-shadow-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.image}
                  alt={data.title}
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/smartwatch.png'; }}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#07070a] to-transparent pointer-events-none" />
      </section>

      {/* ── Feature Badges ── */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="flex flex-wrap justify-center gap-3"
          >
            {data.features.map((f) => (
              <motion.span
                key={f.label}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${ac.badge}`}
              >
                <span>{f.icon}</span>
                {f.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Newsletter / Editorial Sections ── */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-28">
          {data.sections.map((sec, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={sec.heading}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}
              >
                {/* Text side */}
                <div className={isEven ? '' : 'lg:order-2'}>
                  {/* Section number */}
                  <p className={`text-xs font-bold tracking-[0.3em] uppercase mb-3 ${ac.text}`}>
                    0{i + 1} — {data.title}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                    {sec.heading}
                  </h2>
                  <div className={`w-12 h-1 rounded-full mb-6 bg-gradient-to-r`}
                    style={{ background: `linear-gradient(90deg, ${data.accentHex}, transparent)` }}
                  />
                  <p className="text-white/60 text-lg leading-relaxed">
                    {sec.body}
                  </p>
                </div>

                {/* Visual card side */}
                <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    className={`relative rounded-3xl overflow-hidden border ${ac.border} bg-gradient-to-br ${data.gradient} p-10 flex items-center justify-center min-h-[280px]`}
                  >
                    {/* Ambient glow inside card */}
                    <div
                      className="absolute inset-0 opacity-10 blur-2xl"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${data.accentHex}, transparent 70%)` }}
                    />
                    {/* Big icon */}
                    <motion.span
                      animate={{ rotate: [0, 4, 0, -4, 0], y: [0, -6, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                      className="text-[96px] sm:text-[120px] drop-shadow-2xl relative z-10 select-none"
                      style={{ filter: `drop-shadow(0 0 24px ${data.accentHex}88)` }}
                    >
                      {data.icon}
                    </motion.span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA Banner ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className={`relative rounded-3xl overflow-hidden border ${ac.border} bg-gradient-to-br ${data.gradient} p-12 text-center`}
          >
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${data.accentHex}22, transparent 70%)` }}
            />
            <p className="text-5xl mb-5">{data.icon}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to explore <span className="gradient-text">{data.title}</span>?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Browse the full CBRIXI catalogue and find the perfect device for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/marketplace">
                <motion.span
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 cursor-pointer text-lg"
                >
                  Visit Marketplace
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </motion.span>
              </Link>
              <Link href="/#categories">
                <motion.span
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border ${ac.border} ${ac.text} cursor-pointer glass-card text-lg`}
                >
                  More Categories
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer micro ── */}
      <div className="text-center py-10 border-t border-white/5 text-white/20 text-sm">
        © 2026 CBRIXI — Smart Devices for a Smarter Life
      </div>

    </main>
  );
}
