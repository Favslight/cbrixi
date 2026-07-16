'use client';

import { getMobileNavItems } from '@/lib/navLinks';

type MobileNavMenuProps = {
  userLoggedIn: boolean;
  isAdmin?: boolean;
  unreadCount?: number;
  /** Called after a link is activated (e.g. close the drawer). */
  onLinkClick?: () => void;
  /** Visual style: homepage drawer vs marketplace/product sheet */
  variant?: 'drawer' | 'sheet';
};

/**
 * Shared hamburger link list — same items as Homepage Navbar everywhere.
 */
export default function MobileNavMenu({
  userLoggedIn,
  isAdmin = false,
  unreadCount = 0,
  onLinkClick,
  variant = 'sheet',
}: MobileNavMenuProps) {
  const items = getMobileNavItems({ userLoggedIn, isAdmin });

  if (variant === 'drawer') {
    return (
      <div className="flex flex-col gap-4">
        {items.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={onLinkClick}
            className="text-white/70 hover:text-white font-medium text-lg transition-colors flex items-center gap-2"
          >
            {link.label}
            {link.label === 'Notifications' && unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold">{unreadCount}</span>
            )}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((link) => (
        <a
          key={link.label}
          href={link.href}
          onClick={onLinkClick}
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
        >
          <span className="flex-1">{link.label}</span>
          {link.label === 'Notifications' && unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold text-white">{unreadCount}</span>
          )}
        </a>
      ))}
    </div>
  );
}
