'use client';

import { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  /** Total seconds to count down from */
  seconds: number;
  /** Called when countdown reaches 0 */
  onComplete?: () => void;
  /** Restart key — change to reset the timer */
  resetKey?: string | number;
  className?: string;
  label?: string;
  /** Compact circular style for overlays */
  variant?: 'badge' | 'ring' | 'text';
}

export default function CountdownTimer({
  seconds,
  onComplete,
  resetKey,
  className = '',
  label,
  variant = 'badge',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil(seconds)));
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    completedRef.current = false;
    setRemaining(Math.max(0, Math.ceil(seconds)));
  }, [seconds, resetKey]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining]);

  if (seconds <= 0) return null;

  if (variant === 'ring') {
    const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`} aria-live="polite">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="rgb(96,165,250)"
            strokeWidth="3"
            strokeDasharray={`${pct * 0.94} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-bold text-white tabular-nums">{remaining}</span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`tabular-nums ${className}`} aria-live="polite">
        {label ? `${label} ` : ''}
        {remaining}s
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm tabular-nums ${className}`}
      aria-live="polite"
    >
      {label && <span className="text-white/50 font-medium">{label}</span>}
      {remaining}s
    </span>
  );
}
