'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, products as localProducts } from '@/lib/productsStore';
import { useRouter } from 'next/navigation';
import CbrixiLogo from './CbrixiLogo';

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

  const mapProducts = (list: any[]): Product[] =>
    (list || []).map((p: any) => ({
      ...p,
      image: p.image_url || p.image || '/images/smartwatch.png',
      image_urls: (p.image_urls && p.image_urls.length ? p.image_urls : [p.image_url || p.image || '/images/smartwatch.png']).slice(0, 4),
      gradient: p.gradient || 'from-blue-500/20 to-purple-500/20',
      price: p.price
        ? typeof p.price === 'number' || (!isNaN(Number(p.price)) && p.price !== '')
          ? `₦${Number(p.price).toLocaleString()}`
          : p.price.startsWith('₦') ? p.price : `₦${p.price}`
        : '₦N/A',
    }));

  const fetchAllProducts = async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('userToken');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_URL}/products`, { headers });
      const data = await res.json();
      const mapped = mapProducts(data.products || []);
      setAllCategories(Array.from(new Set(mapped.map((p) => p.category).filter(Boolean))));
      setProducts(mapped.length ? mapped : (localProducts as Product[]));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(localProducts as Product[]);
    }
  };

  const fetchByCategory = async (category: string) => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('userToken');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_URL}/products/category/${encodeURIComponent(category)}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        setProducts([]);
        return;
      }
      setProducts(mapProducts(data.products || []));
    } catch (error) {
      console.error('Error fetching category products:', error);
      setProducts([]);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setUserLoggedIn(!!localStorage.getItem('userToken'));

    // Check if category is provided in URL
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) {
      setActiveCategory(cat);
    }

    setLoading(true);
    fetchAllProducts()
      .catch(() => setProducts(localProducts as Product[]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory === 'All') {
      setLoading(true);
      fetchAllProducts()
        .catch(() => setProducts(localProducts as Product[]))
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    fetchByCategory(activeCategory)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedProduct]);

  // Touch handlers for image swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !selectedProduct) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      const totalImages = selectedProduct.image_urls?.length || 1;
      if (diff > 0 && activeImageIndex > 0) {
        // Swipe right - go to previous image
        setActiveImageIndex(activeImageIndex - 1);
      } else if (diff < 0 && activeImageIndex < totalImages - 1) {
        // Swipe left - go to next image
        setActiveImageIndex(activeImageIndex + 1);
      }
    }
    setTouchStartX(null);
  };

  const categories = useMemo(() => {
    // Ensure the requested categories are always available at the top
    const baseCategories = ['All', 'Smart Phones', 'Laptops', 'Smart Watches', 'Smart Home', 'Accessories', 'Vehicles', 'Audio Devices'];
    const dynamicCats = allCategories.filter(c => !baseCategories.includes(c));
    return [...baseCategories, ...dynamicCats];
  }, [allCategories]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <section id="marketplace" className="relative pb-20 min-h-screen bg-[#f4fcf9] dark:bg-[#07070a] transition-colors duration-300">
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
            </div>
          </div>
        )}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                onClick={() => {
                  setSelectedProduct(product);
                  setActiveImageIndex(0);
                }}
                className="cursor-pointer flex flex-col items-center bg-transparent"
              >
                <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-[#111116] overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="py-4 text-center w-full px-2 bg-gray-900 dark:bg-white transition-colors">
                  <h3 className="text-[15px] font-bold text-white dark:text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-[13px] font-bold text-gray-300 dark:text-gray-500 mb-2">{product.category}</p>
                  <p className="text-[14px] font-bold text-gray-400 dark:text-gray-800">{product.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/50 backdrop-blur-3xl" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-[#0a0a0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col shadow-black/80 max-h-[90vh] sm:max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col sm:flex-row w-full flex-1 overflow-hidden">
                <div className="relative flex-shrink-0 h-64 sm:h-auto sm:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-[#07070a] overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${selectedProduct.gradient} opacity-20`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  
                  {/* Main Image with Touch Support */}
                  <div 
                    className="relative w-full h-full overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img 
                      src={selectedProduct.image_urls?.[activeImageIndex] || selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="relative z-10 w-full h-full object-contain" 
                      draggable={false}
                    />
                    
                    {/* Image Navigation Arrows */}
                    {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                      <>
                        {/* Previous Arrow */}
                        {activeImageIndex > 0 && (
                          <button
                            onClick={() => setActiveImageIndex(activeImageIndex - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-colors z-20"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Next Arrow */}
                        {activeImageIndex < (selectedProduct.image_urls.length - 1) && (
                          <button
                            onClick={() => setActiveImageIndex(activeImageIndex + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-colors z-20"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Image Indicators */}
                    {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {selectedProduct.image_urls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              index === activeImageIndex
                                ? 'bg-white/80 scale-125'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8 sm:p-10 flex flex-col justify-center text-white sm:w-1/2 relative bg-[#0a0a0f] overflow-y-auto flex-1">
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">{selectedProduct.name}</h2>
                      <p className="text-xl sm:text-2xl font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-xl whitespace-nowrap">{selectedProduct.price}</p>
                    </div>
                    <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">{selectedProduct.description}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={async () => {
                          if (typeof window === 'undefined') return;
                          
                          const token = localStorage.getItem('userToken');
                          if (!token) {
                            router.push('/auth/login');
                            return;
                          }
                          try {
                            await fetch(`${API_URL}/cart/add`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ product_id: selectedProduct.id, quantity: 1 }),
                            });
                          } catch (error) {
                            console.error('Error adding to cart:', error);
                          }
                        }}
                        className="px-6 h-12 sm:h-11 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Add To Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
