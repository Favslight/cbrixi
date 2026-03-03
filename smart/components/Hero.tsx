'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
    motion, AnimatePresence,
    useMotionValue, useTransform, useSpring,
} from 'framer-motion';

/* ── headlines ─────────────────────────────────────────── */
const HEADLINES = [
    'GET SMARTER WITH CBRIXI',
    'ALL YOUR SMART DEVICES IN ONE PLACE',
    'UPGRADE YOUR LIFESTYLE TODAY',
    'THE FUTURE OF TECH, DELIVERED',
];

/* ── useTypewriter hook ─────────────────────────────────── */
function useTypewriter(words: string[], typingMs = 55, pauseMs = 1800, eraseMs = 30) {
    const [display, setDisplay] = useState('');
    const [wordIdx, setWordIdx] = useState(0);
    const [phase, setPhase] = useState<'typing' | 'pause' | 'erasing'>('typing');
    const [charIdx, setCharIdx] = useState(0);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const word = words[wordIdx];

        if (phase === 'typing') {
            if (charIdx < word.length) {
                timer = setTimeout(() => {
                    setDisplay(word.slice(0, charIdx + 1));
                    setCharIdx((c) => c + 1);
                }, typingMs);
            } else {
                timer = setTimeout(() => setPhase('pause'), pauseMs);
            }
        } else if (phase === 'pause') {
            timer = setTimeout(() => setPhase('erasing'), 200);
        } else {
            if (charIdx > 0) {
                timer = setTimeout(() => {
                    setDisplay(word.slice(0, charIdx - 1));
                    setCharIdx((c) => c - 1);
                }, eraseMs);
            } else {
                setWordIdx((i) => (i + 1) % words.length);
                setPhase('typing');
            }
        }
        return () => clearTimeout(timer);
    }, [phase, charIdx, wordIdx, words, typingMs, pauseMs, eraseMs]);

    return { display, phase };
}

/* ── device carousel config ─────────────────────────────── */
interface DeviceDef { id: string; label: string; glow: string; src: string; wide?: boolean; }
const DEVICES: DeviceDef[] = [
    { id: 'phone', label: 'Smartphone', glow: 'rgba(139,92,246,0.35)', src: '/images/smartphone.png' },
    { id: 'watch', label: 'Smart Watch', glow: 'rgba(56,189,248,0.35)', src: '/images/smartwatch.png' },
    { id: 'laptop', label: 'Laptop', glow: 'rgba(100,100,255,0.30)', src: '/images/laptop.png', wide: true },
    { id: 'speaker', label: 'Smart Speaker', glow: 'rgba(52,211,153,0.35)', src: '/images/speaker.png' },
    { id: 'glasses', label: 'AI Glasses', glow: 'rgba(168,85,247,0.35)', src: '/images/glasses.png', wide: true },
    { id: 'earbuds', label: 'Earbuds', glow: 'rgba(232,121,249,0.35)', src: '/images/earbuds.png' },
];

export default function Hero() {
    const [devIdx, setDevIdx] = useState(0);
    const { display, phase } = useTypewriter(HEADLINES);

    useEffect(() => {
        const id = setInterval(() => setDevIdx((i) => (i + 1) % DEVICES.length), 3800);
        return () => clearInterval(id);
    }, []);

    /* Mouse parallax */
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const sX = useSpring(mouseX, { stiffness: 40, damping: 20 });
    const sY = useSpring(mouseY, { stiffness: 40, damping: 20 });
    const rotX = useTransform(sY, [-300, 300], [7, -7]);
    const rotY = useTransform(sX, [-300, 300], [-7, 7]);

    const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - r.left - r.width / 2);
        mouseY.set(e.clientY - r.top - r.height / 2);
    }, [mouseX, mouseY]);
    const onLeave = useCallback(() => { mouseX.set(0); mouseY.set(0); }, [mouseX, mouseY]);

    const cur = DEVICES[devIdx];

    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center overflow-hidden pt-20"
            onMouseMove={onMove}
            onMouseLeave={onLeave}
        >
            {/* Background orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
                {/* Dynamic device glow */}
                <AnimatePresence mode="wait">
                    <motion.div key={cur.id + '-orb'}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.9 }}
                        className="absolute top-1/2 right-[22%] -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                        style={{ background: cur.glow, opacity: 0.22 }}
                    />
                </AnimatePresence>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* ── LEFT – typewriter ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-6"
                    >
                        {/* Badge */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            Powered by CBRILLIANCE.
                        </motion.div>

                        {/* Typewriter headline */}
                        <div className="min-h-[10rem] sm:min-h-[8rem] flex items-start">
                            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-tight tracking-tight gradient-text">
                                {display}
                                <motion.span
                                    className="inline-block w-[3px] h-[0.9em] bg-blue-400 ml-1 align-middle rounded-sm"
                                    animate={{ opacity: phase === 'pause' ? [1, 0, 1, 0, 1] : 1 }}
                                    transition={{ duration: 0.9, repeat: phase === 'pause' ? Infinity : 0 }}
                                />
                            </h1>
                        </div>

                        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
                            className="text-white/60 text-lg leading-relaxed max-w-lg">
                            Discover the latest smart gadgets designed to simplify and upgrade your lifestyle — from wrist to home.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }}
                            className="flex flex-wrap gap-4 pt-2">
                            <motion.a href="/auth/login" whileHover={{ y: -4, scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 glow-blue hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300">
                                Shop Now
                            </motion.a>
                            <motion.a href="#categories" whileHover={{ y: -4, scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-3 rounded-full font-semibold text-white/80 border border-white/20 hover:border-blue-400/60 hover:text-white hover:bg-white/5 transition-all duration-300">
                                Explore Devices
                            </motion.a>
                        </motion.div>

                        {/* Stats */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                            className="flex gap-8 pt-4 border-t border-white/8 mt-2">
                            {[['10K+', 'Happy Customers'], ['500+', 'Products'], ['99%', 'Satisfaction']].map(([n, l]) => (
                                <div key={l} className="flex flex-col">
                                    <span className="text-2xl font-bold gradient-text">{n}</span>
                                    <span className="text-white/50 text-sm">{l}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* ── RIGHT – 3D device carousel ── */}
                    <motion.div style={{ rotateX: rotX, rotateY: rotY, perspective: 1200 }}
                        className="relative hidden lg:flex flex-col items-center justify-center gap-6 min-h-[520px]">

                        {/* Device slot */}
                        <div className="relative flex items-center justify-center w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={cur.id}
                                    initial={{ opacity: 0, scale: 0.78, rotateY: -30, y: 24 }}
                                    animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.78, rotateY: 30, y: -24 }}
                                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ perspective: 900 }}
                                >
                                    <motion.div
                                        animate={{ y: [0, -16, 0], rotate: [0, 1, -0.5, 0] }}
                                        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                                        className="drop-shadow-2xl"
                                    >
                                        <Image src={cur.src} width={500} height={500} alt={cur.label} className="object-contain w-80 h-80 lg:w-96 lg:h-96 rounded-3xl" priority />
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Label & dots */}
                        <div className="flex flex-col items-center gap-3 z-10">
                            <AnimatePresence mode="wait">
                                <motion.p key={cur.label}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-white/50 text-sm font-medium tracking-widest uppercase">
                                    {cur.label}
                                </motion.p>
                            </AnimatePresence>

                            <div className="flex gap-2">
                                {DEVICES.map((d, i) => (
                                    <button key={d.id} onClick={() => setDevIdx(i)}
                                        className="rounded-full transition-all duration-300 outline-none"
                                        style={{
                                            width: i === devIdx ? 24 : 8, height: 8,
                                            background: i === devIdx
                                                ? 'linear-gradient(90deg,#60a5fa,#a855f7)'
                                                : 'rgba(255,255,255,0.18)',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center pt-1">
                    <div className="w-1 h-2 bg-blue-400 rounded-full" />
                </motion.div>
            </motion.div>
        </section>
    );
}
