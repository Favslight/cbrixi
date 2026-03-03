'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from './ThemeSwitcher';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'MarketPlace', href: '/marketplace' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Contact', href: '/#contact' },
];

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 6H3m4 7a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/8 shadow-2xl shadow-black/40'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.a
              href="#"
              className="flex items-center gap-2 group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="0" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-widest text-white">
                CBRI<span className="text-blue-400">XI</span>
              </span>
            </motion.a>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.label} href={link.href} label={link.label} />
              ))}
            </div>

            {/* Right icons */}
            <div className="hidden md:flex items-center gap-3">
              <ThemeSwitcher />
              <IconButton href="#cart" label="Cart" Icon={CartIcon} />
              <IconButton href="#account" label="Account" Icon={UserIcon} />
              <motion.a
                href="/auth/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="ml-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-shadow duration-300"
              >
                Shop Now
              </motion.a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden text-white/80 hover:text-white transition-colors p-1"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-white/8 px-6 py-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white font-medium text-lg transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="flex gap-3 pt-2 border-t border-white/10 mt-2">
                <a href="#cart" className="text-white/60 hover:text-white transition-colors"><CartIcon /></a>
                <a href="#account" className="text-white/60 hover:text-white transition-colors"><UserIcon /></a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
