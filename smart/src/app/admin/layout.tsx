'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/auth/login');
    } else {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const closeIfDesktop = () => {
      if (mq.matches) setMobileSidebarOpen(false);
    };
    closeIfDesktop();
    mq.addEventListener('change', closeIfDesktop);
    return () => mq.removeEventListener('change', closeIfDesktop);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-white/40 text-sm tracking-widest uppercase">Authenticating…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white overflow-x-hidden lg:flex">
      <AdminSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <main className="min-h-screen min-w-0 flex-1 lg:ml-64">
        <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-white/8 bg-[#07070a]/95 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/15 text-white/80 hover:bg-white/5 hover:border-white/25 transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={mobileSidebarOpen}
            aria-controls="admin-sidebar-nav"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold tracking-wide text-white/80">CBRIXI Admin</span>
          <div className="w-10 shrink-0" aria-hidden />
        </div>
        {children}
      </main>
    </div>
  );
}
