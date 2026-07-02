import { motion } from 'framer-motion';

interface CbrixiLogoProps {
  /** Height of the logo image in pixels (default 32). */
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
  size = 32,
  className = '',
  animate = true,
  textSize: _textSize = 'text-xl',
}: CbrixiLogoProps) {
  const logoHeight = Math.max(size, 24);
  const logoWidth = logoHeight * 4.35;

  const Wrapper = animate ? motion.a : 'a';
  const wrapperProps = animate
    ? { whileHover: { scale: 1.03, y: -1 }, href: '/' }
    : { href: '/' };

  return (
    <Wrapper
      {...(wrapperProps as any)}
      aria-label="CBRIXI home"
      className={`group relative inline-flex items-center ${className}`}
    >
      <div
        className="relative rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 p-[1px] shadow-lg shadow-blue-500/20 transition-shadow duration-300 group-hover:shadow-cyan-400/25"
        style={{
          width: logoWidth,
          height: logoHeight + 8,
        }}
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[11px] bg-white px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/CBRIXI LOGO.png"
            alt="CBRIXI"
            className="block h-full w-full object-contain"
          />
        </div>
      </div>
    </Wrapper>
  );
}
