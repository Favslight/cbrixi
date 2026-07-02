import Link from 'next/link';
import { motion } from 'framer-motion';

interface CbrixiLogoProps {
  /** Height of the logo mark in pixels (default 30). */
  size?: number;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Whether to animate on hover (default true). */
  animate?: boolean;
  /** Kept for backwards compatibility with older call sites. */
  textSize?: string;
}

/**
 * The single source-of-truth CBRIXI logo.
 */
export default function CbrixiLogo({
  size = 30,
  className = '',
  animate = true,
  textSize = 'text-xl',
}: CbrixiLogoProps) {
  const logoSize = Math.max(size, 22);
  const content = (
    <>
      <span
        aria-hidden="true"
        className="relative inline-flex shrink-0 items-center justify-center rounded-[30%] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white shadow-[0_8px_24px_rgba(0,114,255,0.28)] ring-1 ring-white/20 transition-shadow duration-300 group-hover:shadow-[0_10px_30px_rgba(0,198,255,0.35)]"
        style={{ width: logoSize, height: logoSize }}
      >
        <span className="absolute inset-[3px] rounded-[27%] border border-white/35" />
        <span className="relative text-[0.58em] font-black tracking-[-0.08em]">CB</span>
      </span>
      <span
        className={`bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text font-black tracking-[0.14em] text-transparent drop-shadow-[0_2px_12px_rgba(56,189,248,0.22)] ${textSize}`}
      >
        CBRIXI
      </span>
    </>
  );

  return (
    <Link
      href="/"
      aria-label="CBRIXI home"
      className={`group inline-flex items-center gap-2.5 bg-transparent ${className}`}
    >
      {animate ? (
        <motion.span whileHover={{ scale: 1.03, y: -1 }} className="inline-flex items-center gap-2.5">
          {content}
        </motion.span>
      ) : (
        content
      )}
    </Link>
  );
}
