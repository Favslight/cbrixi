'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Product {
  id: string; name: string; price: string;
  description: string; image: string; category: string; createdAt: string;
  image_urls?: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') ?? '' : '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';
    const res = await fetch(`${API_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    const mappedProducts = (d.products || []).map((p: any) => ({
      ...p,
      image: p.image_url || p.image || '/images/smartwatch.png',
      image_urls: (p.image_urls && p.image_urls.length ? p.image_urls : [p.image_url || p.image || '/images/smartwatch.png']).slice(0, 4)
    }));
    setProducts(mappedProducts);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';
    await fetch(`${API_URL}/admin/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setProducts((p) => p.filter((x) => x.id !== id));
    setDeletingId(null);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-white/40 text-sm mt-1">{products.length} items in catalogue</p>
        </div>
        <Link href="/admin/products/new">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm cursor-pointer shadow-lg shadow-blue-500/25">
            <span className="text-lg">＋</span> Add Product
          </motion.div>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or categories…"
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <>
        {/* Mobile / small tablet: cards */}
        <div className="space-y-3 lg:hidden">
          <AnimatePresence>
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt="" className="w-14 h-14 object-contain rounded-xl bg-white/5 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/images/smartwatch.png'; }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm leading-snug">{product.name}</p>
                    <p className="text-white font-bold mt-1">{product.price}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{product.category}</span>
                      <span className="text-white/40 text-xs">{product.createdAt}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setPreviewImages(product.image_urls || [product.image])}
                        className="text-xs text-blue-300 border border-blue-400/30 rounded-lg px-3 py-1.5 hover:bg-blue-500/10"
                      >
                        View images
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="text-xs font-medium text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-3 py-1.5 disabled:opacity-40"
                      >
                        {deletingId === product.id ? 'Deleting…' : 'Delete'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-center py-12 text-white/30 rounded-2xl border border-white/8">No products found.</p>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden lg:block rounded-2xl border border-white/8 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-5 py-3.5 text-white/40 font-medium">Product</th>
                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Category</th>
                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Price</th>
                <th className="text-left px-4 py-3.5 text-white/40 font-medium">Added</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/images/smartwatch.png'; }} />
                        <span className="text-white font-medium truncate max-w-[200px] xl:max-w-[280px]">{product.name}</span>
                        <button
                          type="button"
                          onClick={() => setPreviewImages(product.image_urls || [product.image])}
                          className="text-[11px] text-blue-300 border border-blue-400/30 rounded-full px-2 py-1 hover:bg-blue-500/10"
                        >
                          View Images
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{product.category}</span>
                    </td>
                    <td className="px-4 py-4 text-white font-semibold">{product.price}</td>
                    <td className="px-4 py-4 text-white/40">{product.createdAt}</td>
                    <td className="px-4 py-4">
  <div className="flex items-center justify-end gap-2">
    <Link href={`/admin/products/${product.id}/edit`}>
      <motion.div
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-300 border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
      >
        Edit
      </motion.div>
    </Link>
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={() => handleDelete(product.id)}
      disabled={deletingId === product.id}
      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-colors disabled:opacity-40"
    >
      {deletingId === product.id ? '�' : 'Delete'}
    </motion.button>
  </div>
</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-white/30">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
      <AnimatePresence>
        {previewImages && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setPreviewImages(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[85dvh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c10] p-4 sm:p-5 mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Product Images</h3>
                <button className="text-white/60 hover:text-white" onClick={() => setPreviewImages(null)}>Close</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewImages.slice(0, 4).map((img, index) => (
                  <div key={`${img}-${index}`} className="rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Product image ${index + 1}`} className="w-full h-32 object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

