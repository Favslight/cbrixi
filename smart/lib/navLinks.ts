/** Shared site nav — keep Homepage Navbar and marketplace/product headers in sync. */
export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'MarketPlace', href: '/marketplace' },
  { label: 'Orders', href: '/orders' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Contact', href: '/#contact' },
] as const;

export const categoryMenu = [
  { label: 'Smart Watches', href: '/marketplace?category=Smart+Watches' },
  { label: 'Smart Home', href: '/marketplace?category=Smart+Home' },
  { label: 'Audio Devices', href: '/marketplace?category=Audio+Devices' },
  { label: 'Accessories', href: '/marketplace?category=Accessories' },
  { label: 'Smart Phones', href: '/marketplace?category=Smart+Phones' },
  { label: 'Vehicles', href: '/marketplace?category=Vehicles' },
] as const;

export type NavLink = { label: string; href: string };

/** Extra drawer links shown for logged-in non-admin users (matches Navbar). */
export function getLoggedInNavExtras(): NavLink[] {
  return [
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile & Referrals', href: '/profile' },
  ];
}

export function getMobileNavItems(opts: {
  userLoggedIn: boolean;
  isAdmin?: boolean;
}): NavLink[] {
  const items: NavLink[] = navLinks.map(({ label, href }) => ({ label, href }));
  if (opts.userLoggedIn && !opts.isAdmin) {
    items.push(...getLoggedInNavExtras());
  }
  return items;
}
