'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DiscountPreview, formatMoney, toNumber } from '@/lib/pricing';

const CATEGORIES = ['Smart Watches', 'Smart Home', 'Audio Devices', 'Accessories', 'Smart Phones', 'Laptops', 'Vehicles'];
const MAX_PRODUCT_IMAGES = 7;

interface ExistingProductImage {
  url: string;
  public_id: string;
}

interface EditFormState {
  name: string;
  price: string;
  discount_enabled: boolean;
  discount_percentage: string;
  description: string;
  category: string;
  stock: string;
  installment_enabled: boolean;
  minimum_deposit_percentage: string;
  installment_duration_months: string;
  fine_percentage_on_default: string;
  minimum_wallet_balance_required: string;
  grace_period_days: string;
  existingImages: ExistingProductImage[];
  newImages: File[];
  newImagePreviews: string[];
  thumbnailIndex: number;
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

  const [form, setForm] = useState<EditFormState>({
    name: '',
    price: '',
    discount_enabled: false,
    discount_percentage: '',
    description: '',
    category: 'Smart Watches',
    stock: '',
    installment_enabled: false,
    minimum_deposit_percentage: '',
    installment_duration_months: '',
    fine_percentage_on_default: '',
    minimum_wallet_balance_required: '',
    grace_period_days: '',
    existingImages: [],
    newImages: [],
    newImagePreviews: [],
    thumbnailIndex: 0,
  });
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [discountPreview, setDiscountPreview] = useState<DiscountPreview | null>(null);
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

        const imageUrls: string[] = (product.image_urls && product.image_urls.length
          ? product.image_urls
          : [product.image_url || product.image || '/images/smartwatch.png']).slice(0, MAX_PRODUCT_IMAGES);
        const publicIds: string[] = Array.isArray(product.image_public_ids) ? product.image_public_ids : [];
        const existingImages = imageUrls.map((url, index) => ({
          url,
          public_id: publicIds[index] || (index === 0 ? String(product.image_public_id ?? '') : ''),
        }));
        const primaryImageUrl = String(product.image_url || product.image || imageUrls[0] || '');
        const thumbnailIndex = Math.max(0, existingImages.findIndex((image) => image.url === primaryImageUrl));

        setForm({
          name: String(product.name ?? ''),
          price: String(product.price ?? ''),
          discount_enabled: product.discount_enabled === true,
          discount_percentage: String(product.discount_percentage ?? ''),
          description: String(product.description ?? ''),
          category: String(product.category ?? 'Smart Watches'),
          stock: String(product.stock ?? ''),
          installment_enabled: product.installment_enabled === true,
          minimum_deposit_percentage: String(product.minimum_deposit_percentage ?? ''),
          installment_duration_months: String(product.installment_duration_months ?? ''),
          fine_percentage_on_default: String(product.fine_percentage_on_default ?? ''),
          minimum_wallet_balance_required: String(product.minimum_wallet_balance_required ?? ''),
          grace_period_days: String(product.grace_period_days ?? ''),
          existingImages,
          newImages: [],
          newImagePreviews: [],
          thumbnailIndex,
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
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setError('');
  };

  useEffect(() => {
    if (bootLoading) return;

    const price = toNumber(form.price);
    const percentage = toNumber(form.discount_percentage);

    if (!form.price.trim() || price <= 0) {
      setPreviewLoading(false);
      setDiscountPreview(null);
      return;
    }

    if (form.discount_enabled && (percentage <= 0 || percentage > 100)) {
      setPreviewLoading(false);
      setDiscountPreview(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const token = localStorage.getItem('adminToken') ?? '';
        const res = await fetch(`${API_URL}/admin/products/discount-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price,
            discount_enabled: form.discount_enabled,
            ...(form.discount_enabled ? { discount_percentage: percentage } : {}),
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok && data.success && data.discount) {
          setDiscountPreview(data.discount);
        } else {
          setDiscountPreview(null);
        }
      } catch (previewError) {
        if (!(previewError instanceof DOMException && previewError.name === 'AbortError')) {
          setDiscountPreview(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [API_URL, bootLoading, form.discount_enabled, form.discount_percentage, form.price]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - form.existingImages.length);
    const imageFiles = selected.filter((file) => file.type.startsWith('image/')).slice(0, availableSlots);
    const newImagePreviews = imageFiles.map((file) => URL.createObjectURL(file));

    setForm((prev) => ({
      ...prev,
      newImages: imageFiles,
      newImagePreviews,
      thumbnailIndex: Math.min(prev.thumbnailIndex, Math.max(prev.existingImages.length + imageFiles.length - 1, 0)),
    }));
    if (selected.length !== imageFiles.length) {
      setError(`Only image files are accepted, and the final product image count cannot exceed ${MAX_PRODUCT_IMAGES}.`);
    } else {
      setError('');
    }
  };

  const moveExistingImage = (fromIndex: number, direction: -1 | 1) => {
    setForm((prev) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= prev.existingImages.length) return prev;

      const existingImages = [...prev.existingImages];
      [existingImages[fromIndex], existingImages[toIndex]] = [existingImages[toIndex], existingImages[fromIndex]];

      let thumbnailIndex = prev.thumbnailIndex;
      if (thumbnailIndex === fromIndex) thumbnailIndex = toIndex;
      else if (thumbnailIndex === toIndex) thumbnailIndex = fromIndex;

      return { ...prev, existingImages, thumbnailIndex };
    });
  };

  const moveNewImage = (fromIndex: number, direction: -1 | 1) => {
    setForm((prev) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= prev.newImages.length) return prev;

      const newImages = [...prev.newImages];
      const newImagePreviews = [...prev.newImagePreviews];
      [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
      [newImagePreviews[fromIndex], newImagePreviews[toIndex]] = [newImagePreviews[toIndex], newImagePreviews[fromIndex]];

      const offset = prev.existingImages.length;
      let thumbnailIndex = prev.thumbnailIndex;
      if (thumbnailIndex === offset + fromIndex) thumbnailIndex = offset + toIndex;
      else if (thumbnailIndex === offset + toIndex) thumbnailIndex = offset + fromIndex;

      return { ...prev, newImages, newImagePreviews, thumbnailIndex };
    });
  };

  const removeExistingImage = (indexToRemove: number) => {
    setForm((prev) => {
      const existingImages = prev.existingImages.filter((_, index) => index !== indexToRemove);
      const finalCount = existingImages.length + prev.newImages.length;
      let thumbnailIndex = prev.thumbnailIndex;
      if (thumbnailIndex === indexToRemove) thumbnailIndex = 0;
      else if (thumbnailIndex > indexToRemove) thumbnailIndex -= 1;

      return {
        ...prev,
        existingImages,
        thumbnailIndex: Math.min(thumbnailIndex, Math.max(finalCount - 1, 0)),
      };
    });
  };

  const removeNewImage = (indexToRemove: number) => {
    setForm((prev) => {
      const offset = prev.existingImages.length;
      const absoluteIndex = offset + indexToRemove;
      const newImages = prev.newImages.filter((_, index) => index !== indexToRemove);
      const newImagePreviews = prev.newImagePreviews.filter((_, index) => index !== indexToRemove);
      const finalCount = prev.existingImages.length + newImages.length;
      let thumbnailIndex = prev.thumbnailIndex;
      if (thumbnailIndex === absoluteIndex) thumbnailIndex = 0;
      else if (thumbnailIndex > absoluteIndex) thumbnailIndex -= 1;

      return {
        ...prev,
        newImages,
        newImagePreviews,
        thumbnailIndex: Math.min(thumbnailIndex, Math.max(finalCount - 1, 0)),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.name.trim() || !form.price.trim() || !form.description.trim()) {
      setError('Please fill in name, price, and description.');
      return;
    }
    if (form.discount_enabled) {
      const percentage = toNumber(form.discount_percentage);
      if (percentage <= 0 || percentage > 100) {
        setError('Discount percentage must be greater than 0 and less than or equal to 100.');
        return;
      }
    }
    if (form.installment_enabled) {
      const depositPercent = toNumber(form.minimum_deposit_percentage);
      const months = toNumber(form.installment_duration_months);
      if (depositPercent <= 0 || depositPercent > 100 || months <= 0) {
        setError('Enter a valid installment deposit percentage and duration.');
        return;
      }
    }
    const finalImageCount = form.existingImages.length + form.newImages.length;
    if (finalImageCount < 1 || finalImageCount > MAX_PRODUCT_IMAGES) {
      setError(`A product must have between 1 and ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken') ?? '';
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('price', form.price);
      formData.append('discount_enabled', String(form.discount_enabled));
      if (form.discount_enabled) {
        formData.append('discount_percentage', form.discount_percentage);
      }
      formData.append('description', form.description);
      formData.append('category', form.category);
      if (form.stock.trim() !== '') formData.append('stock', form.stock);
      formData.append('installment_enabled', String(form.installment_enabled));
      if (form.installment_enabled) {
        formData.append('minimum_deposit_percentage', form.minimum_deposit_percentage);
        formData.append('installment_duration_months', form.installment_duration_months);
        formData.append('fine_percentage_on_default', form.fine_percentage_on_default || '0');
        formData.append('minimum_wallet_balance_required', form.minimum_wallet_balance_required || '0');
        formData.append('grace_period_days', form.grace_period_days || '0');
      }
      formData.append('images_manifest', JSON.stringify(form.existingImages));
      formData.append('thumbnail_index', String(form.thumbnailIndex));
      form.newImages.forEach((image) => {
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
        <p className="text-white/40 text-sm mt-1">Update product details, image order, and thumbnail selection.</p>
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

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-white/70">
            <span>Temporary Discount</span>
            <input name="discount_enabled" type="checkbox" checked={form.discount_enabled} onChange={handleChange} className="rounded" />
          </label>
          {form.discount_enabled && (
            <div>
              <label className={labelClass}>Discount Percentage (%)</label>
              <input name="discount_percentage" type="number" value={form.discount_percentage} onChange={handleChange} className={inputClass} min="0.01" max="100" step="0.01" />
            </div>
          )}
          <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-sm text-white/65">
            {previewLoading ? (
              <span>Checking discount...</span>
            ) : discountPreview ? (
              <div className="space-y-1">
                <p>Selling price: <span className="font-semibold text-white">{formatMoney(discountPreview.effective_price)}</span></p>
                {discountPreview.discount_enabled && (
                  <p>
                    Save {formatMoney(discountPreview.discount_amount)} with {Number(discountPreview.discount_percentage)}% off.
                  </p>
                )}
              </div>
            ) : (
              <span>Enter a valid price to preview the selling price.</span>
            )}
          </div>
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
          <label className="flex items-center gap-2 text-sm font-medium text-white/70">
            <input name="installment_enabled" type="checkbox" checked={form.installment_enabled} onChange={handleChange} className="rounded" />
            Enable Installments
          </label>
        </div>

        {form.installment_enabled && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            <div>
              <label className={labelClass}>Minimum Deposit Percentage (%) <span className="text-red-400">*</span></label>
              <input name="minimum_deposit_percentage" type="number" value={form.minimum_deposit_percentage} onChange={handleChange} placeholder="e.g. 30" className={inputClass} min="0" max="100" />
            </div>
            <div>
              <label className={labelClass}>Installment Duration (Months) <span className="text-red-400">*</span></label>
              <input name="installment_duration_months" type="number" value={form.installment_duration_months} onChange={handleChange} placeholder="e.g. 6" className={inputClass} min="1" />
            </div>
            <div>
              <label className={labelClass}>Fine Percentage on Default (%)</label>
              <input name="fine_percentage_on_default" type="number" value={form.fine_percentage_on_default} onChange={handleChange} placeholder="e.g. 5" className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Minimum Wallet Balance Required</label>
              <input name="minimum_wallet_balance_required" type="number" value={form.minimum_wallet_balance_required} onChange={handleChange} placeholder="e.g. 50" className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Grace Period (Days)</label>
              <input name="grace_period_days" type="number" value={form.grace_period_days} onChange={handleChange} placeholder="e.g. 7" className={inputClass} min="0" />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Product Images (1 to 7)</label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all" />
          <p className="text-xs text-white/40 mt-2">Existing images are kept in this order. New uploads are appended after them.</p>
          {form.existingImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.existingImages.map((image, index) => (
                <div key={`${image.url}-${index}`} className="relative rounded-xl border border-white/10 bg-white/5 p-2">
                  <img src={image.url} alt={`Existing image ${index + 1}`} className="w-full h-24 object-contain rounded-lg bg-white" />
                  {form.thumbnailIndex === index && <span className="absolute top-3 left-3 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">Thumb</span>}
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <button type="button" onClick={() => moveExistingImage(index, -1)} disabled={index === 0} className="px-2 py-1 rounded-lg bg-white/8 text-white/70 disabled:opacity-30">Up</button>
                    <button type="button" onClick={() => moveExistingImage(index, 1)} disabled={index === form.existingImages.length - 1} className="px-2 py-1 rounded-lg bg-white/8 text-white/70 disabled:opacity-30">Down</button>
                  </div>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, thumbnailIndex: index }))} className="mt-2 w-full rounded-lg border border-blue-500/30 px-2 py-1.5 text-xs text-blue-200 hover:bg-blue-500/10">
                    Set thumbnail
                  </button>
                  <button type="button" onClick={() => removeExistingImage(index)} className="mt-2 w-full rounded-lg border border-red-500/30 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.newImagePreviews.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase text-white/50 mt-5">New uploads</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.newImagePreviews.map((preview, index) => {
                  const absoluteIndex = form.existingImages.length + index;
                  return (
                    <div key={`${preview}-${index}`} className="relative rounded-xl border border-white/10 bg-white/5 p-2">
                      <img src={preview} alt={`New upload ${index + 1}`} className="w-full h-24 object-contain rounded-lg bg-white" />
                      {form.thumbnailIndex === absoluteIndex && <span className="absolute top-3 left-3 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">Thumb</span>}
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <button type="button" onClick={() => moveNewImage(index, -1)} disabled={index === 0} className="px-2 py-1 rounded-lg bg-white/8 text-white/70 disabled:opacity-30">Up</button>
                        <button type="button" onClick={() => moveNewImage(index, 1)} disabled={index === form.newImagePreviews.length - 1} className="px-2 py-1 rounded-lg bg-white/8 text-white/70 disabled:opacity-30">Down</button>
                      </div>
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, thumbnailIndex: absoluteIndex }))} className="mt-2 w-full rounded-lg border border-blue-500/30 px-2 py-1.5 text-xs text-blue-200 hover:bg-blue-500/10">
                        Set thumbnail
                      </button>
                      <button type="button" onClick={() => removeNewImage(index)} className="mt-2 w-full rounded-lg border border-red-500/30 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
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
