'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { fetchHeroCarouselSlides, type HeroCarouselSlide } from '@/lib/heroCarousel';

const HEADLINES = [
  'GET SMARTER WITH CBRIXI',
  'ALL YOUR SMART DEVICES IN ONE PLACE',
  'UPGRADE YOUR LIFESTYLE TODAY',
  'THE FUTURE OF TECH, DELIVERED',
];

interface DeviceDef {
  id: string;
  label: string;
  glow: string;
  src: string;
  wide?: boolean;
}

const DEVICES: DeviceDef[] = [
  { id: 'phone', label: 'Smartphone', glow: 'rgba(139,92,246,0.35)', src: '/images/smartphone.png' },
  { id: 'watch', label: 'Smart Watch', glow: 'rgba(56,189,248,0.35)', src: '/images/smartwatch.png' },
  { id: 'laptop', label: 'Laptop', glow: 'rgba(100,100,255,0.30)', src: '/images/laptop.png', wide: true },
  { id: 'speaker', label: 'Smart Speaker', glow: 'rgba(52,211,153,0.35)', src: '/images/speaker.png' },
  { id: 'glasses', label: 'AI Glasses', glow: 'rgba(168,85,247,0.35)', src: '/images/glasses.png', wide: true },
  { id: 'earbuds', label: 'Earbuds', glow: 'rgba(232,121,249,0.35)', src: '/images/earbuds.png' },
];

const positionClass: Record<string, string> = {
  LEFT: 'items-start text-left',
  CENTER: 'items-center text-center mx-auto',
  RIGHT: 'items-end text-right ml-auto',
};

const readabilityOverlayClass: Record<string, string> = {
  LEFT: 'bg-[linear-gradient(90deg,rgba(7,7,10,0.64)_0%,rgba(7,7,10,0.36)_38%,rgba(7,7,10,0.08)_72%,transparent_100%)]',
  CENTER: 'bg-[radial-gradient(circle_at_center,rgba(7,7,10,0.50)_0%,rgba(7,7,10,0.24)_42%,rgba(7,7,10,0.04)_78%,transparent_100%)]',
  RIGHT: 'bg-[linear-gradient(270deg,rgba(7,7,10,0.64)_0%,rgba(7,7,10,0.36)_38%,rgba(7,7,10,0.08)_72%,transparent_100%)]',
};

export default function Hero() {
  const [slides, setSlides] = useState<HeroCarouselSlide[]>([]);
  const [index, setIndex] = useState(0);
  const [failedVideoIds, setFailedVideoIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHeroCarouselSlides()
      .then((nextSlides) => {
        if (!cancelled) {
          setSlides(nextSlides);
          setIndex(0);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlides([]);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slide = slides[index];
  const autoplayMs = useMemo(() => Math.max(3, slide?.autoplay_seconds ?? 6) * 1000, [slide?.autoplay_seconds]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, slides.length]);

  if (loaded && !slide) return <DefaultHero />;
  if (!slide) return <DefaultHero />;

  const textPosition = slide.text_position ?? 'LEFT';
  const contentClass = positionClass[textPosition] ?? positionClass.LEFT;
  const overlayClass = readabilityOverlayClass[textPosition] ?? readabilityOverlayClass.LEFT;
  const accent = slide.accent_color || '#60a5fa';
  const href = slide.product_id ? `/product/${slide.product_id}` : slide.link_url || '/marketplace';
  const hasTextContent = Boolean(
    slide.eyebrow ||
    slide.title ||
    slide.subtitle ||
    slide.description ||
    slide.badge_text
  );
  const altText = slide.alt_text || slide.title || 'Cbrixi homepage hero advert';
  const isVideo = slide.media_type === 'VIDEO' && Boolean(slide.video_url) && !failedVideoIds.has(slide.id);
  const fallbackImage = slide.image_url;

  return (
    <section id="hero" className="relative min-h-screen overflow-hidden pt-20" aria-label="Homepage featured adverts">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {isVideo ? (
            <>
              <video
                src={slide.video_url ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                poster={slide.image_url ?? undefined}
                onError={() => setFailedVideoIds((current) => new Set(current).add(slide.id))}
                className={`h-full w-full object-cover ${slide.mobile_video_url ? 'hidden sm:block' : ''}`}
              />
              {slide.mobile_video_url && (
                <video
                  src={slide.mobile_video_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={slide.mobile_image_url || slide.image_url || undefined}
                  onError={() => setFailedVideoIds((current) => new Set(current).add(slide.id))}
                  className="h-full w-full object-cover sm:hidden"
                />
              )}
            </>
          ) : fallbackImage ? (
            <>
              <Image
                src={fallbackImage}
                alt={altText}
                fill
                priority
                sizes="100vw"
                className={`object-cover ${slide.mobile_image_url ? 'hidden sm:block' : ''}`}
              />
              {slide.mobile_image_url && (
                <Image
                  src={slide.mobile_image_url}
                  alt={altText}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover sm:hidden"
                />
              )}
            </>
          ) : (
            <div className="h-full w-full bg-[#07070a]" />
          )}
        </motion.div>
      </AnimatePresence>

      {hasTextContent && (
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute inset-0 ${overlayClass}`} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07070a]/45 to-transparent sm:h-40" />
          <motion.div
            className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-600/18 blur-3xl sm:h-96 sm:w-96"
            animate={{ x: [0, 38, 0], y: [0, -18, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-7rem] top-1/3 h-72 w-72 rounded-full bg-purple-600/16 blur-3xl sm:h-96 sm:w-96"
            animate={{ x: [0, -34, 0], y: [0, 22, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 10.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-8 left-1/3 h-52 w-52 rounded-full blur-3xl sm:h-72 sm:w-72"
            style={{ backgroundColor: `${accent}24` }}
            animate={{ x: [0, 28, -12, 0], y: [0, -20, 10, 0], opacity: [0.7, 1, 0.75] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-20">
          {hasTextContent && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${slide.id}-content`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45 }}
                className={`flex max-w-3xl flex-col gap-5 sm:gap-6 ${contentClass}`}
              >
                {(slide.eyebrow || slide.badge_text) && (
                  <div
                    className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-white"
                    style={{ borderColor: `${accent}66`, backgroundColor: `${accent}1f` }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                    {slide.eyebrow || slide.badge_text}
                  </div>
                )}

                <div className="space-y-4">
                  {slide.title && (
                    <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-tight tracking-tight gradient-text drop-shadow-[0_3px_18px_rgba(0,0,0,0.55)]">
                      {slide.title}
                    </h1>
                  )}
                  {slide.subtitle && <p className="text-lg sm:text-2xl font-semibold text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">{slide.subtitle}</p>}
                  {slide.description && <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{slide.description}</p>}
                  {slide.badge_text && slide.eyebrow && (
                    <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                      {slide.badge_text}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <motion.div whileHover={{ y: -4, scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={href}
                      className="inline-flex px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 glow-blue hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
                    >
                      Shop Now
                    </Link>
                  </motion.div>
                  <motion.a
                    href="#categories"
                    whileHover={{ y: -4, scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 rounded-full font-semibold text-white/80 border border-white/20 hover:border-blue-400/60 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    Explore Devices
                  </motion.a>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {slides.length > 1 && (
            <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((item, slideIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  aria-label={`Show hero slide ${slideIndex + 1}`}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: slideIndex === index ? 28 : 8,
                    background: slideIndex === index ? 'linear-gradient(90deg,#60a5fa,#a855f7)' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

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
          setCharIdx((current) => current + 1);
        }, typingMs);
      } else {
        timer = setTimeout(() => setPhase('pause'), pauseMs);
      }
    } else if (phase === 'pause') {
      timer = setTimeout(() => setPhase('erasing'), 200);
    } else if (charIdx > 0) {
      timer = setTimeout(() => {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx((current) => current - 1);
      }, eraseMs);
    } else {
      timer = setTimeout(() => {
        setWordIdx((current) => (current + 1) % words.length);
        setPhase('typing');
      }, 0);
    }

    return () => clearTimeout(timer);
  }, [phase, charIdx, wordIdx, words, typingMs, pauseMs, eraseMs]);

  return { display, phase };
}

function DefaultHero() {
  const [devIdx, setDevIdx] = useState(0);
  const { display, phase } = useTypewriter(HEADLINES);

  useEffect(() => {
    const id = setInterval(() => setDevIdx((current) => (current + 1) % DEVICES.length), 3800);
    return () => clearInterval(id);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const sY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  const rotX = useTransform(sY, [-300, 300], [7, -7]);
  const rotY = useTransform(sX, [-300, 300], [-7, 7]);

  const onMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left - rect.width / 2);
    mouseY.set(event.clientY - rect.top - rect.height / 2);
  }, [mouseX, mouseY]);

  const onLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const cur = DEVICES[devIdx];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-label="Cbrixi hero"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cur.id}-orb`}
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
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Powered by CBRILLIANCE.
            </motion.div>

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

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-white/60 text-lg leading-relaxed max-w-lg"
            >
              Discover the latest smart gadgets designed to simplify and upgrade your lifestyle from wrist to home.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <motion.a
                href="/auth/login"
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 glow-blue hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
              >
                Shop Now
              </motion.a>
              <motion.a
                href="#categories"
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 rounded-full font-semibold text-white/80 border border-white/20 hover:border-blue-400/60 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                Explore Devices
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-8 pt-4 border-t border-white/8 mt-2"
            >
              {[['10K+', 'Happy Customers'], ['500+', 'Products'], ['99%', 'Satisfaction']].map(([n, l]) => (
                <div key={l} className="flex flex-col">
                  <span className="text-2xl font-bold gradient-text">{n}</span>
                  <span className="text-white/50 text-sm">{l}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            style={{ rotateX: rotX, rotateY: rotY, perspective: 1200 }}
            className="relative hidden lg:flex flex-col items-center justify-center gap-6 min-h-[520px]"
          >
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

            <div className="flex flex-col items-center gap-3 z-10">
              <AnimatePresence mode="wait">
                <motion.p
                  key={cur.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/50 text-sm font-medium tracking-widest uppercase"
                >
                  {cur.label}
                </motion.p>
              </AnimatePresence>

              <div className="flex gap-2">
                {DEVICES.map((device, deviceIndex) => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => setDevIdx(deviceIndex)}
                    aria-label={`Show ${device.label}`}
                    className="rounded-full transition-all duration-300 outline-none"
                    style={{
                      width: deviceIndex === devIdx ? 24 : 8,
                      height: 8,
                      background: deviceIndex === devIdx
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
    </section>
  );
}
