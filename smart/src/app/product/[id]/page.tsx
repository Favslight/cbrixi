'use client';

import { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CbrixiLogo from '@/components/CbrixiLogo';
import { Product, products as localProducts } from '@/lib/productsStore';
import { formatMoney, getSellingPrice, hasActiveDiscount, toNumber } from '@/lib/pricing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

const mapProducts = (list: any[]): Product[] =>
  (list || []).map((p: any) => ({
    ...p,
    image: p.image_url || p.image || '/images/smartwatch.png',
    image_urls: (p.image_urls && p.image_urls.length ? p.image_urls : [p.image_url || p.image || '/images/smartwatch.png']).slice(0, 7),
    gradient: p.gradient || 'from-blue-500/20 to-purple-500/20',
    price: p.price
      ? typeof p.price === 'number' || (!isNaN(Number(p.price)) && p.price !== '')
        ? `₦${Number(p.price).toLocaleString()}`
        : p.price.startsWith('₦') ? p.price : `₦${p.price}`
      : '₦N/A',
    installment_enabled: p.installment_enabled ?? true,
    installment_duration_months: p.installment_duration_months ?? 12,
    minimum_deposit_percentage: p.minimum_deposit_percentage ?? 20,
    fine_percentage_on_default: p.fine_percentage_on_default ?? 5,
    stock: p.stock ?? 10,
    minimum_wallet_balance_required: p.minimum_wallet_balance_required ?? 50,
    grace_period_days: p.grace_period_days ?? 7,
  }));

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedInstallmentMonths, setSelectedInstallmentMonths] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartNotice, setCartNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  const fetchProduct = async (productId: string) => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('userToken');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_URL}/products/${productId}`, { headers });
      console.log('API response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('API response data:', data);
        const mapped = mapProducts([data.product])[0];
        setProduct(mapped);
        return mapped;
      } else {
        console.log('API response not ok:', res.status);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
    
    // Fallback to local products - try to find by ID, or use first product as fallback
    const localProduct = localProducts.find(p => p.id === productId);
    if (localProduct) {
      console.log('Found local product by ID:', localProduct);
      setProduct(localProduct);
      return localProduct;
    }
    
    // If API failed and no local ID match, try to fetch all products first and find the product
    console.log('No local product found by ID, fetching all products to find match');
    try {
      const res = await fetch(`${API_URL}/products`, { headers });
      if (res.ok) {
        const data = await res.json();
        const allMapped = mapProducts(data.products || []);
        const foundProduct = allMapped.find(p => p.id === productId);
        if (foundProduct) {
          console.log('Found product in all products:', foundProduct);
          setProduct(foundProduct);
          return foundProduct;
        }
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
    }
    
    // If still no match, use the first local product as fallback
    console.log('No product found anywhere, using first local product as fallback');
    if (localProducts.length > 0) {
      setProduct(localProducts[0]);
      return localProducts[0];
    }
    
    return null;
  };

  const fetchAllProducts = async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('userToken');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_URL}/products`, { headers });
      const data = await res.json();
      const mapped = mapProducts(data.products || []);
      setAllProducts(mapped.length ? mapped : (localProducts as Product[]));
    } catch (error) {
      console.error('Error fetching products:', error);
      setAllProducts(localProducts as Product[]);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setUserLoggedIn(!!localStorage.getItem('userToken'));
    
    const loadProduct = async () => {
      setLoading(true);
      const fetchedProduct = await fetchProduct(id);
      await fetchAllProducts();
      setLoading(false);
      
      if (fetchedProduct && fetchedProduct.installment_duration_months) {
        setSelectedInstallmentMonths(fetchedProduct.installment_duration_months);
      }
    };
    
    loadProduct();
  }, [id]);

  const showCartNotice = (notice: { type: 'success' | 'error'; message: string }) => {
    setCartNotice(notice);
    window.setTimeout(() => setCartNotice(null), 3200);
  };

  const handleAddToCart = async () => {
    if (!product || typeof window === 'undefined' || addingToCart) return;

    const token = localStorage.getItem('userToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setAddingToCart(true);
    setCartNotice(null);

    try {
      const res = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Could not add item to cart.');
      }

      showCartNotice({ type: 'success', message: `${product.name} added to cart.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add item to cart.';
      showCartNotice({ type: 'error', message });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    // Add to cart first, then redirect to checkout
    const token = localStorage.getItem('userToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setAddingToCart(true);
    try {
      await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      router.push('/checkout');
    } catch (error) {
      showCartNotice({ type: 'error', message: 'Could not process purchase.' });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyInInstallment = async () => {
    if (!product) return;
    
    const token = localStorage.getItem('userToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setAddingToCart(true);
    try {
      await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      router.push('/checkout');
    } catch (error) {
      showCartNotice({ type: 'error', message: 'Could not process installment purchase.' });
    } finally {
      setAddingToCart(false);
    }
  };

  const similarProducts = allProducts.filter(p => p.category === product?.category && p.id !== product?.id).slice(0, 5);
  const otherProducts = allProducts.filter(p => p.id !== product?.id).sort(() => Math.random() - 0.5).slice(0, 5);

  const installmentAmount = product ? toNumber(getSellingPrice(product)) / (selectedInstallmentMonths || product.installment_duration_months || 1) : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07070a] text-white flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#07070a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/marketplace" className="text-blue-400 hover:text-blue-300">
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-white relative overflow-x-hidden">
      {/* Cart Notice */}
      {cartNotice && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`fixed left-1/2 top-20 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
            cartNotice.type === 'success'
              ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-100'
              : 'border-red-500/25 bg-red-500/15 text-red-100'
          }`}
        >
          {cartNotice.message}
        </motion.div>
      )}

      {/* Header - Marketplace Style */}
      <div className="bg-white dark:bg-gray-950/80 dark:backdrop-blur-xl px-4 py-3 flex items-center justify-between shadow-sm dark:shadow-none dark:border-b dark:border-white/10 sticky top-0 z-50">
        {/* Logo / Home */}
        <div className="flex items-center">
          <CbrixiLogo />
        </div>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="relative flex items-center border border-gray-300 dark:border-white/15 rounded-lg overflow-hidden bg-white dark:bg-white/5 h-10 w-full">
            <div className="pl-3 text-gray-500 dark:text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, Categories"
              className="w-full h-full px-3 text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none bg-transparent"
            />
            <button className="h-full px-5 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Icon - Only visible on mobile when search is closed */}
          {!searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white p-2"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* Close Search Icon - Only visible on mobile when search is open */}
          {searchOpen && (
            <button
              onClick={() => setSearchOpen(false)}
              className="md:hidden text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white p-2"
              aria-label="Close search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Profile Icon - Always visible on mobile when logged in */}
          {userLoggedIn && (
            <button onClick={() => router.push('/profile')} className="text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          )}

          {/* Cart Icon - Always visible on mobile */}
          <button onClick={() => router.push('/cart')} className="text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 6H3m4 7a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </button>

          {/* Hamburger Menu - Always visible */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Search Field - Below Navbar for Mobile */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-white dark:bg-gray-950/95 dark:backdrop-blur-xl border-b dark:border-white/10 px-4 py-4 shadow-lg overflow-hidden"
          >
            <div className="max-w-4xl mx-auto flex gap-3">
              <div className="flex-1 relative flex items-center border border-gray-300 dark:border-white/15 rounded-lg overflow-hidden bg-white dark:bg-white/5 h-12">
                <div className="pl-4 text-gray-500 dark:text-white/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, Categories"
                  className="flex-1 h-full px-4 text-base text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none bg-transparent"
                  autoFocus
                />
              </div>
              <button className="px-6 h-12 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950/95 dark:backdrop-blur-xl border-b dark:border-white/10 px-4 py-4 shadow-lg">
          <div className="flex flex-col gap-3">
            {!userLoggedIn && (
              <button 
                onClick={() => {
                  router.push('/auth/login');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 transition-shadow duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </button>
            )}
            <button 
              onClick={() => {
                router.push('/marketplace');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Marketplace</span>
            </button>
            <button 
              onClick={() => {
                router.push('/');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </button>
            <button 
              onClick={() => {
                router.push('/#categories');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Categories</span>
            </button>
            <button 
              onClick={() => {
                router.push('/#contact');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact</span>
            </button>
            {userLoggedIn && (
              <button 
                onClick={() => {
                  router.push('/profile');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </button>
            )}
            <button 
              onClick={() => {
                router.push('/cart');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 6H3m4 7a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span>Cart</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Marketplace */}
        <div className="mb-6">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to Marketplace</span>
          </Link>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-8">
          <Link href="/marketplace" className="hover:text-white transition-colors">Home</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/marketplace?category=${encodeURIComponent(product.category)}`} className="hover:text-white transition-colors">{product.category}</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white/60 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-[#111116] rounded-2xl overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-20`} />
              <img
                src={product.image_urls?.[activeImageIndex] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              {product.image_urls && product.image_urls.length > 1 && (
                <>
                  {activeImageIndex > 0 && (
                    <button
                      onClick={() => setActiveImageIndex(activeImageIndex - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {activeImageIndex < (product.image_urls.length - 1) && (
                    <button
                      onClick={() => setActiveImageIndex(activeImageIndex + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.image_urls.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-blue-500' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right - Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-400 mb-2">{product.category}</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">{product.name}</h1>
              
              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-blue-300">
                  {formatMoney(getSellingPrice(product))}
                </span>
                {hasActiveDiscount(product) && (
                  <>
                    <span className="text-xl text-white/40 line-through">{formatMoney(product.price)}</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-sm font-bold">
                      {Number(product.discount_percentage)}% OFF
                    </span>
                  </>
                )}
              </div>


              {/* Installment Info */}
              {product.installment_enabled && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-white/60 mb-2">Pay in installments</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-blue-300">{formatMoney(installmentAmount)}</span>
                    <span className="text-white/40">for {selectedInstallmentMonths || product.installment_duration_months} months</span>
                  </div>
                  
                  {/* Installment Duration Options */}
                  <div className="flex flex-wrap gap-2">
                    {[6, 8, 12, 18].filter(m => m <= (product.installment_duration_months || 12)).map((months) => (
                      <button
                        key={months}
                        onClick={() => setSelectedInstallmentMonths(months)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedInstallmentMonths === months
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {months} months
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingToCart ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={addingToCart}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>

                {product.installment_enabled && (
                  <button
                    onClick={handleBuyInInstallment}
                    disabled={addingToCart}
                    className="flex-1 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Buy in Installments
                  </button>
                )}
              </div>

              {/* Delivery Info */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <div>
                    <p className="font-medium text-white mb-1">Free Delivery</p>
                    <p className="text-sm text-white/50">Estimated delivery: 3-5 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information/Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Product Information</h2>
          <div className="bg-[#111116] border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-white/40 mb-1">Category</p>
                <p className="font-medium text-white">{product.category}</p>
              </div>
              {product.installment_enabled && (
                <>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Installment Duration</p>
                    <p className="font-medium text-white">{product.installment_duration_months} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Min Deposit</p>
                    <p className="font-medium text-white">{product.minimum_deposit_percentage}%</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-white/40 mb-2">Description</p>
              <p className="text-white/70 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Similar Products</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {similarProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex-shrink-0 w-48 bg-[#111116] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="aspect-square bg-white/5">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-white truncate mb-2">{p.name}</p>
                    <p className="text-sm font-bold text-blue-300">{formatMoney(getSellingPrice(p))}</p>
                    <button className="mt-3 w-full py-2 rounded-lg bg-white/5 text-white/70 text-sm hover:bg-white/10 transition-colors">
                      View More
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other Products */}
        {otherProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Other Products</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {otherProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex-shrink-0 w-48 bg-[#111116] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="aspect-square bg-white/5">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-white truncate mb-2">{p.name}</p>
                    <p className="text-sm font-bold text-blue-300">{formatMoney(getSellingPrice(p))}</p>
                    <button className="mt-3 w-full py-2 rounded-lg bg-white/5 text-white/70 text-sm hover:bg-white/10 transition-colors">
                      View More
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#0a0a0f] border-t border-white/10 px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CbrixiLogo size={24} textSize="text-base" />
              <p className="text-white/40 text-sm">© 2024 CBRIXI. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/marketplace" className="text-white/40 hover:text-white text-sm transition-colors">Marketplace</Link>
              <Link href="/about" className="text-white/40 hover:text-white text-sm transition-colors">About</Link>
              <Link href="/contact" className="text-white/40 hover:text-white text-sm transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
