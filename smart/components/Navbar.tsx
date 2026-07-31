'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from './ThemeSwitcher';
import CbrixiLogo from './CbrixiLogo';
import { API_URL } from '@/lib/api';
import { navLinks, categoryMenu, getLoggedInNavExtras } from '@/lib/navLinks';

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 6H3m4 7a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function AccountAvatar({
  isAdmin,
  userInitial,
  size = "sm",
}: {
  isAdmin: boolean;
  userInitial: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "md" ? "w-6 h-6 text-xs" : "w-5 h-5 text-sm";
  if (isAdmin) {
    return (
      <div className={`${box} flex items-center justify-center font-bold bg-purple-500/20 text-purple-400 rounded-full`}>
        A
      </div>
    );
  }
  if (userInitial) {
    return (
      <div className={`${box} flex items-center justify-center font-bold bg-blue-500/20 text-blue-400 rounded-full`}>
        {userInitial}
      </div>
    );
  }
  return <UserIcon />;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ firstname?: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    
    const authTimer = window.setTimeout(() => {
      const userData = localStorage.getItem("userData");
      if (userData) {
          try {
              const parsed = JSON.parse(userData);
              setUser(parsed.user ?? parsed);
          } catch (e) {
              console.error("Error parsing user data", e);
          }
      }

      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
          setIsAdmin(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(authTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token || isAdmin) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUnreadCount(data.count ?? data.unread_count ?? 0);
        }
      } catch {
        // ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, user]);

  const userInitial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : null;
  const accountHref = isAdmin ? "/admin" : user ? "/profile" : "/auth/login";

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/45'
          : 'bg-gray-950/72 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/25'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <CbrixiLogo />

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                link.label === 'Categories'
                  ? <CategoriesNavLink key={link.label} href={link.href} label={link.label} />
                  : <NavLink key={link.label} href={link.href} label={link.label} />
              ))}
            </div>

            {/* Right icons */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeSwitcher />
              {user && !isAdmin && (
                <a href="/notifications" aria-label="Notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </a>
              )}
              <IconButton href="/cart" label="Cart" Icon={CartIcon} />
              <IconButton
                href={accountHref}
                label="Account"
                Icon={() => <AccountAvatar isAdmin={isAdmin} userInitial={userInitial} />}
              />
              
                <motion.a
                    href={(user || isAdmin) ? "/marketplace" : "/auth/login"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    className="ml-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-shadow duration-300"
                >
                    Shop Now
                </motion.a>
            </div>

            {/* Mobile top-bar actions — profile stays visible with hamburger closed */}
            <div className="flex md:hidden items-center gap-2 ml-2">
              {user && !isAdmin && (
                <a
                  href="/notifications"
                  aria-label="Notifications"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </a>
              )}
              <a href="/cart" className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all" aria-label="Cart">
                <CartIcon />
              </a>
              <a
                href={accountHref}
                aria-label="Account"
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                <AccountAvatar isAdmin={isAdmin} userInitial={userInitial} />
              </a>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>

            {/* Desktop hamburger (drawer still available on larger screens) */}
            <div className="hidden md:flex items-center ml-2">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/8 px-6 py-6"
          >
            <div className="flex flex-col gap-4">
              {[
                ...navLinks,
                ...(user && !isAdmin ? getLoggedInNavExtras() : []),
              ].map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white font-medium text-lg transition-colors flex items-center gap-2"
                >
                  {link.label}
                  {link.label === 'Notifications' && unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold">{unreadCount}</span>
                  )}
                </motion.a>
              ))}
              <div className="flex gap-3 pt-2 border-t border-white/10 mt-2">
                <a href={accountHref} className="text-white/60 hover:text-white transition-colors" aria-label="Account">
                  <AccountAvatar isAdmin={isAdmin} userInitial={userInitial} size="md" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Mobile Cart Icon */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <motion.a
          href="/cart"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
          aria-label="Cart"
        >
          <CartIcon />
        </motion.a>
      </div>
    </>
  );
}

interface NavLinkProps { href: string; label: string; }
function NavLink({ href, label }: NavLinkProps) {
  return (
    <motion.a
      href={href}
      className="relative group px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
      whileHover="hover"
    >
      {label}
      <motion.span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
        variants={{ hover: { width: '60%', opacity: 1 }, initial: { width: 0, opacity: 0 } }}
        initial="initial"
        style={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
    </motion.a>
  );
}

function CategoriesNavLink({ href, label }: NavLinkProps) {
  return (
    <div className="relative group">
      <NavLink href={href} label={label} />
      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
        <div className="w-60 rounded-xl border border-white/10 bg-gray-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-2 grid grid-cols-1 gap-1">
          {categoryMenu.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

interface IconButtonProps { href: string; label: string; Icon: React.ComponentType; }
function IconButton({ href, label, Icon }: IconButtonProps) {
  return (
    <motion.a
      href={href}
      aria-label={label}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
    >
      <Icon />
    </motion.a>
  );
}
