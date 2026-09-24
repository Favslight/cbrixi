'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import { fetchMarketplaceStatus, MarketplaceStatus } from '@/lib/marketplace';

const RECHECK_INTERVAL_MS = 30_000;

/**
 * Renders children only while the marketplace is open. When an admin locks it
 * shoppers see an "under review" screen instead, and the page opens up again on
 * its own once the marketplace is unlocked (rechecked periodically and whenever
 * the tab regains focus).
 */
export default function MarketplaceGate({ children }: { children: React.ReactNode }) {
  // `undefined` = first check still in flight, `null` = unknown (fail open).
  const [status, setStatus] = useState<MarketplaceStatus | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const next = await fetchMarketplaceStatus();
      if (cancelled) return;
      // Keep the last known state if a recheck fails, rather than flapping.
      setStatus((prev) => (next === null && prev !== undefined ? prev : next));
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    check();
    const interval = window.setInterval(check, RECHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (status === undefined) {
    return (
      <main className="min-h-screen bg-[#07070a] flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </main>
    );
  }

  if (status?.locked) {
    return <MarketplaceLockedScreen title={status.title} message={status.message} />;
  }

  return <>{children}</>;
}

export function MarketplaceLockedScreen({ title, message }: { title: string; message: string }) {
  return (
    <main className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-center gap-6 p-8 text-center">
      <Navbar />
      <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
        <svg className="w-9 h-9 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <div className="max-w-md space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
        <p className="text-white/60 leading-relaxed">{message}</p>
        <p className="text-white/40 text-sm">This page will open automatically as soon as the marketplace is back.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors">
          Back Home
        </Link>
        <Link href="/orders" className="px-6 py-3 rounded-xl border border-white/15 hover:bg-white/5 text-white/80 font-semibold transition-colors">
          My Orders
        </Link>
      </div>
    </main>
  );
}
