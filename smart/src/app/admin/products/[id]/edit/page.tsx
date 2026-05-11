'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CATEGORIES = ['Smart Watches', 'Smart Home', 'Audio Devices', 'Accessories', 'Smart Phones', 'Laptops'];

interface EditFormState {
  name: string;
  price: string;
  description: string;
  category: string;
  stock: string;
  images: File[];
  imagePreviews: string[];
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

  const [form, setForm] = useState<EditFormState>({
    name: '',
    price: '',
    description: '',
    category: 'Smart Watches',
    stock: '',
    images: [],
    imagePreviews: [],
  });
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setBootLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken') ?? '';
        const res = await fetch(`${API_URL}/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const product = (data.products || []).find((p: any) => String(p.id) === String(id));

        if (!product) {
          setError('Product not found.');
          setBootLoading(false);
          return;
        }

        const existingImages: string[] = (product.image_urls && product.image_urls.length
          ? product.image_urls
          : [product.image_url || product.image || '/images/smartwatch.png']).slice(0, 4);

        setForm({
          name: String(product.name ?? ''),
          price: String(product.price ?? ''),
          description: String(product.description ?? ''),
          category: String(product.category ?? 'Smart Watches'),
          stock: String(product.stock ?? ''),
          images: [],
          imagePreviews: existingImages,
        });
      } catch {
        setError('Failed to load product.');
      } finally {
        setBootLoading(false);
      }
    };

    loadProduct();
  }, [API_URL, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 4);
    const previews = selected.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({
      ...prev,
      images: selected,
      imagePreviews: previews.length > 0 ? previews : prev.imagePreviews,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.name.trim() || !form.price.trim() || !form.description.trim()) {
      setError('Please fill in name, price, and description.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', form.price);
      formData.append('description', form.description);
      formData.append('category', form.category);
      if (form.stock.trim() !== '') formData.append('stock', form.stock);
      form.images.forEach((image, index) => {
        if (index === 0) formData.append('image', image);
        formData.append('images', image);
      });

      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? 'Failed to update product.');
        setLoading(false);
        return;
      }

      router.push('/admin/products');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-white/70 mb-2';

  if (bootLoading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen max-w-2xl">
      <Link href="/admin/products">
        <motion.span whileHover={{ x: -3 }} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 cursor-pointer transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </motion.span>
      </Link>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Product</h1>
        <p className="text-white/40 text-sm mt-1">Update product details and optionally upload new images.</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="space-y-6 bg-white/3 border border-white/8 rounded-3xl p-5 sm:p-8"
      >
        <div>
          <label className={labelClass}>Product Name</label>
          <input name="name" value={form.name} onChange={handleChange} className={inputClass} required />
        </div>

        <div>
          <label className={labelClass}>Price</label>
          <input name="price" value={form.price} onChange={handleChange} className={inputClass} required />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm appearance-none cursor-pointer">
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={`${inputClass} resize-none`} required />
        </div>

        <div>
          <label className={labelClass}>Stock Quantity</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} className={inputClass} min="0" />
        </div>

        <div>
          <label className={labelClass}>Product Images (optional, up to 4)</label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all" />
          <p className="text-xs text-white/40 mt-2">Upload new images only if you want to replace existing ones.</p>
          {form.imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.imagePreviews.slice(0, 4).map((preview, index) => (
                <div key={`${preview}-${index}`} className="relative">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg bg-white/5 p-1" />
                  {index === 0 && <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">Thumb</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </motion.button>
          <Link href="/admin/products">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 rounded-xl font-semibold text-white/60 border border-white/10 hover:border-white/20 hover:text-white transition-all cursor-pointer text-center">
              Cancel
            </motion.div>
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
