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
  const iconSize = size;
  const svgSize = Math.round(iconSize * 0.5);

  const Wrapper = animate ? motion.a : 'a';
  const wrapperProps = animate
    ? { whileHover: { scale: 1.03 }, href: '/' }
    : { href: '/' };

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={`flex items-center gap-2 group ${className}`}
    >
      {/* Icon — gradient square with stacked layers */}
      <div
        style={{ width: iconSize, height: iconSize }}
        className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0"
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-white"
        >
          {/* Three horizontal stacked-layer paths — the CBRIXI icon mark */}
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 12l10 5 10-5" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      </div>

      {/* Wordmark */}
      <span className={`${textSize} font-bold tracking-widest text-white leading-none`}>
        CBRI<span className="text-blue-400">XI</span>
      </span>
    </Wrapper>
  );
}
