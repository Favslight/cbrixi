import { motion } from 'framer-motion';

interface CbrixiLogoProps {
  /** Size of the icon square in pixels (default 32) */
  size?: number;
  /** Extra classes on the outer wrapper */
  className?: string;
  /** Whether to animate on hover (default true) */
  animate?: boolean;
  /** Text size class, e.g. 'text-xl' (default 'text-xl') */
  textSize?: string;
}

/**
 * The single source-of-truth CBRIXI logo.
 *
 * Icon: stacked-layers SVG inside a blue→purple gradient square.
 * Wordmark: "CBRI" white + "XI" blue-400, Space Grotesk bold, tracked-widest.
 *
 * Used in: Navbar, Footer, Auth layout, Admin sidebar.
 */
export default function CbrixiLogo({
  size = 32,
  className = '',
  animate = true,
  textSize = 'text-xl',
}: CbrixiLogoProps) {
  const iconSize = size * 1.4;

  const Wrapper = animate ? motion.a : 'a';
  const wrapperProps = animate
    ? { whileHover: { scale: 1.03 }, href: '/' }
    : { href: '/' };

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={`flex items-center gap-2.5 group ${className}`}
    >
      {/* Logo icon — uses the uploaded logo.jpg
          Technique: The image (dark logo on white bg) is inverted so the logo
          becomes white and the bg becomes black. Then rendered on a black
          container with overflow hidden. The whole container uses
          mix-blend-mode: screen so black = invisible, white logo = visible. */}
      <div
        style={{ 
          width: iconSize, 
          height: iconSize,
          mixBlendMode: 'screen',
          background: '#000',
          borderRadius: 6,
          overflow: 'hidden',
        }}
        className="flex-shrink-0 flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="CBRIXI"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'invert(1)',
          }}
        />
      </div>

      {/* Wordmark */}
      <span className={`${textSize} font-extrabold tracking-widest text-white leading-none`}>
        CBRIXI
      </span>
    </Wrapper>
  );
}
