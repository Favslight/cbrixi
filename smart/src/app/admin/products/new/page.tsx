'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

const CATEGORIES = ['Smart Watches', 'Smart Home', 'Audio Devices', 'Accessories', 'Smart Phones', 'Laptops'];

interface FormState {
  name: string;
  price: string;
  description: string;
  images: File[];
  imagePreviews: string[];
  category: string;
  minimum_deposit_percentage: number;
  installment_duration_months: number;
  fine_percentage_on_default: number;
  stock: number;
  installment_enabled: boolean;
  minimum_wallet_balance_required: number;
  grace_period_days: number;
}

export default function NewProduct() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    price: '',
    description: '',
    images: [],
    imagePreviews: [],
    category: 'Smart Watches',
    minimum_deposit_percentage: 20,
    installment_duration_months: 12,
    fine_percentage_on_default: 5,
    stock: 1,
    installment_enabled: true,
    minimum_wallet_balance_required: 50,
    grace_period_days: 7,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value
    }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 4);
    const previews = selected.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({
      ...prev,
      images: selected,
      imagePreviews: previews
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.toString().trim() || !form.description.trim() || form.images.length === 0) {
      setError('Please fill in all required fields and upload at least one image.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') ?? '';

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', form.price.toString());
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('minimum_deposit_percentage', form.minimum_deposit_percentage.toString());
      formData.append('installment_duration_months', form.installment_duration_months.toString());
      formData.append('fine_percentage_on_default', form.fine_percentage_on_default.toString());
      formData.append('stock', form.stock.toString());
      formData.append('installment_enabled', form.installment_enabled.toString());
      formData.append('minimum_wallet_balance_required', form.minimum_wallet_balance_required.toString());
      formData.append('grace_period_days', form.grace_period_days.toString());

      form.images.forEach((image, index) => {
        if (index === 0) {
          formData.append('image', image);
        }
        formData.append('images', image);
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

      const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Let browser set Content-Type with boundary for FormData
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        setError(data.message ?? 'Failed to create product.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const inputClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-white/70 mb-2';

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen w-full max-w-2xl">
      {/* Back link */}
      <Link href="/admin/products">
        <motion.span whileHover={{ x: -3 }} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 cursor-pointer transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </motion.span>
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Add New Product</h1>
        <p className="text-white/40 text-sm mt-1">Fill in the details below to create a new product listing.</p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="space-y-6 bg-white/3 border border-white/8 rounded-3xl p-5 sm:p-8"
      >
        {/* Product Name */}
        <div>
          <label className={labelClass}>Product Name <span className="text-red-400">*</span></label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. CBRIXI Smartwatch Pro" className={inputClass} required />
        </div>

        {/* Price */}
        <div>
          <label className={labelClass}>Price <span className="text-red-400">*</span></label>
          <input name="price" value={form.price} onChange={handleChange} placeholder="e.g. 299" className={inputClass} required />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category <span className="text-red-400">*</span></label>
          <select name="category" value={form.category} onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm appearance-none cursor-pointer">
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description <span className="text-red-400">*</span></label>
          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Describe the product features, specs, and benefits…"
            rows={4} className={`${inputClass} resize-none`} required />
        </div>

        {/* Minimum Deposit Percentage */}
        <div>
          <label className={labelClass}>Minimum Deposit Percentage (%)</label>
          <input name="minimum_deposit_percentage" type="number" value={form.minimum_deposit_percentage} onChange={handleChange} placeholder="e.g. 20" className={inputClass} min="0" max="100" />
        </div>

        {/* Installment Duration Months */}
        <div>
          <label className={labelClass}>Installment Duration (Months)</label>
          <input name="installment_duration_months" type="number" value={form.installment_duration_months} onChange={handleChange} placeholder="e.g. 12" className={inputClass} min="1" />
        </div>

        {/* Fine Percentage on Default */}
        <div>
          <label className={labelClass}>Fine Percentage on Default (%)</label>
          <input name="fine_percentage_on_default" type="number" value={form.fine_percentage_on_default} onChange={handleChange} placeholder="e.g. 5" className={inputClass} min="0" />
        </div>

        {/* Stock */}
        <div>
          <label className={labelClass}>Stock Quantity</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="e.g. 50" className={inputClass} min="0" />
        </div>

        {/* Installment Enabled */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70">
            <input name="installment_enabled" type="checkbox" checked={form.installment_enabled} onChange={handleChange} className="rounded" />
            Enable Installments
          </label>
        </div>

        {/* Minimum Wallet Balance Required */}
        <div>
          <label className={labelClass}>Minimum Wallet Balance Required</label>
          <input name="minimum_wallet_balance_required" type="number" value={form.minimum_wallet_balance_required} onChange={handleChange} placeholder="e.g. 50" className={inputClass} min="0" />
        </div>

        {/* Grace Period Days */}
        <div>
          <label className={labelClass}>Grace Period (Days)</label>
          <input name="grace_period_days" type="number" value={form.grace_period_days} onChange={handleChange} placeholder="e.g. 7" className={inputClass} min="0" />
        </div>

        {/* Image Upload */}
        <div>
          <label className={labelClass}>Product Images (up to 4) <span className="text-red-400">*</span></label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all" required />
          <p className="text-xs text-white/40 mt-2">The first image becomes the thumbnail (legacy image).</p>
          {form.imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.imagePreviews.map((preview, index) => (
                <div key={preview} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg bg-white/5 p-1" />
                  {index === 0 && <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">Thumb</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-stretch">
          <Link href="/admin/products" className="sm:shrink-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-white/60 border border-white/10 hover:border-white/20 hover:text-white transition-all cursor-pointer text-center">
              Cancel
            </motion.div>
          </Link>
          <motion.button
            type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex-1 min-h-[48px] py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Creating…</>
            ) : '＋ Create Product'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

