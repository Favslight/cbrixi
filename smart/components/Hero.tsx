'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchHeroCarouselSlides, type HeroCarouselSlide } from '@/lib/heroCarousel';

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

  useEffect(() => {
    let cancelled = false;
    fetchHeroCarouselSlides()
      .then((nextSlides) => {
        if (!cancelled) {
          setSlides(nextSlides);
          setIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
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

  if (!slide) return null;

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
