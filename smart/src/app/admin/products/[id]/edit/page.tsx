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

interface ProductVariantForm {
  id?: string;
  name: string;
  ram: string;
  rom: string;
  color: string;
  sku: string;
  price: string;
}

interface ProductSpecificationItemForm {
  key: string;
  value: string;
}

interface ProductSpecificationSectionForm {
  section: string;
  items: ProductSpecificationItemForm[];
}

interface EditFormState {
  name: string;
  price: string;
  discount_enabled: boolean;
  discount_percentage: string;
  display_order: string;
  description: string;
  specifications: ProductSpecificationSectionForm[];
  category: string;
  installment_enabled: boolean;
  minimum_deposit_percentage: string;
  installment_duration_months: string;
  existingImages: ExistingProductImage[];
  newImages: File[];
  newImagePreviews: string[];
  thumbnailIndex: number;
  variants: ProductVariantForm[];
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
    display_order: '',
    description: '',
    specifications: [],
    category: 'Smart Watches',
    installment_enabled: false,
    minimum_deposit_percentage: '',
    installment_duration_months: '',
    existingImages: [],
    newImages: [],
    newImagePreviews: [],
    thumbnailIndex: 0,
    variants: [],
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
        const variants = (Array.isArray(product.variants) ? product.variants : [])
          .filter((variant: any) => variant && variant.is_active !== false)
          .map((variant: any) => {
            const specs = variant.specs && typeof variant.specs === 'object' ? variant.specs : {};
            return {
              id: variant.id ? String(variant.id) : undefined,
              name: String(variant.name ?? ''),
              ram: String(specs.ram ?? ''),
              rom: String(specs.rom ?? specs.storage ?? ''),
              color: String(specs.color ?? ''),
              sku: String(variant.sku ?? ''),
              price: String(variant.price ?? ''),
            };
          });
        const specifications = (Array.isArray(product.specifications) ? product.specifications : []).map((section: any) => ({
          section: String(section.section ?? ''),
          items: (Array.isArray(section.items) ? section.items : []).map((item: any) => ({
            key: String(item.key ?? ''),
            value: String(item.value ?? ''),
          })),
        }));

        setForm({
          name: String(product.name ?? ''),
          price: String(product.price ?? ''),
          discount_enabled: product.discount_enabled === true,
          discount_percentage: String(product.discount_percentage ?? ''),
          display_order: product.display_order === undefined || product.display_order === null ? '' : String(product.display_order),
          description: String(product.description ?? ''),
          specifications,
          category: String(product.category ?? 'Smart Watches'),
          installment_enabled: product.installment_enabled === true,
          minimum_deposit_percentage: String(product.minimum_deposit_percentage ?? ''),
          installment_duration_months: String(product.installment_duration_months ?? ''),
          existingImages,
          newImages: [],
          newImagePreviews: [],
          thumbnailIndex,
          variants,
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
    const selectedImages = selected.filter((file) => file.type.startsWith('image/'));
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - form.existingImages.length - form.newImages.length);
    const imageFiles = selectedImages.slice(0, availableSlots);
    const newImagePreviews = imageFiles.map((file) => URL.createObjectURL(file));

    setForm((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...imageFiles],
      newImagePreviews: [...prev.newImagePreviews, ...newImagePreviews],
      thumbnailIndex: prev.existingImages.length + prev.newImages.length > 0
        ? prev.thumbnailIndex
        : Math.min(prev.thumbnailIndex, Math.max(imageFiles.length - 1, 0)),
    }));
    e.target.value = '';
    if (selected.length !== imageFiles.length || selectedImages.length > imageFiles.length) {
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

  const addSpecificationSection = () => setForm((prev) => ({
    ...prev,
    specifications: [...prev.specifications, { section: '', items: [{ key: '', value: '' }] }],
  }));

  const updateSpecificationSection = (sectionIndex: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((section, index) => index === sectionIndex ? { ...section, section: value } : section),
    }));
  };

  const removeSpecificationSection = (sectionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, index) => index !== sectionIndex),
    }));
  };

  const addSpecificationItem = (sectionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((section, index) => (
        index === sectionIndex ? { ...section, items: [...section.items, { key: '', value: '' }] } : section
      )),
    }));
  };

  const updateSpecificationItem = (sectionIndex: number, itemIndex: number, field: keyof ProductSpecificationItemForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((section, index) => (
        index === sectionIndex
          ? {
              ...section,
              items: section.items.map((item, nextItemIndex) => nextItemIndex === itemIndex ? { ...item, [field]: value } : item),
            }
          : section
      )),
    }));
  };

  const removeSpecificationItem = (sectionIndex: number, itemIndex: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((section, index) => (
        index === sectionIndex ? { ...section, items: section.items.filter((_, nextItemIndex) => nextItemIndex !== itemIndex) } : section
      )),
    }));
  };

  const addVariant = () => setForm((prev) => ({
    ...prev,
    variants: [...prev.variants, { name: '', ram: '', rom: '', color: '', sku: '', price: '' }],
  }));

  const updateVariant = (index: number, field: keyof ProductVariantForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, [field]: value } : variant),
    }));
  };

  const removeVariant = (index: number) => setForm((prev) => ({
    ...prev,
    variants: prev.variants.filter((_, variantIndex) => variantIndex !== index),
  }));

  const buildVariantsPayload = () => form.variants.map((variant) => ({
    ...(variant.id ? { id: variant.id } : {}),
    name: variant.name.trim(),
    specs: Object.fromEntries(Object.entries({ ram: variant.ram, rom: variant.rom, color: variant.color }).filter(([, value]) => value.trim() !== '')),
    price: toNumber(variant.price),
    ...(variant.sku.trim() ? { sku: variant.sku.trim() } : {}),
  }));

  const buildSpecificationsPayload = () => form.specifications
    .map((section) => ({
      section: section.section.trim(),
      items: section.items
        .map((item) => ({ key: item.key.trim(), value: item.value.trim() }))
        .filter((item) => item.key && item.value),
    }))
    .filter((section) => section.section && section.items.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.name.trim() || !form.description.trim()) {
      setError('Please fill in name and description.');
      return;
    }
    if (!form.price.trim() && form.variants.length === 0) {
      setError('Enter a price, or keep at least one variant so the backend can derive the product price.');
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
    if (form.variants.length > 0) {
      const invalidVariant = form.variants.some((variant) => !variant.name.trim() || toNumber(variant.price) <= 0);
      if (invalidVariant) {
        setError('Every variant needs a name and valid price.');
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
      if (form.price.trim()) {
        formData.append('price', form.price);
      }
      if (form.display_order.trim()) {
        formData.append('display_order', form.display_order);
      }
      formData.append('discount_enabled', String(form.discount_enabled));
      if (form.discount_enabled) {
        formData.append('discount_percentage', form.discount_percentage);
      }
      formData.append('description', form.description);
      formData.append('specifications', JSON.stringify(buildSpecificationsPayload()));
      formData.append('category', form.category);
      if (form.variants.length > 0) {
        formData.append('variants', JSON.stringify(buildVariantsPayload()));
      }
      formData.append('installment_enabled', String(form.installment_enabled));
      if (form.installment_enabled) {
        formData.append('minimum_deposit_percentage', form.minimum_deposit_percentage);
        formData.append('installment_duration_months', form.installment_duration_months);
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
          <label className={labelClass}>Price {form.variants.length === 0 && <span className="text-red-400">*</span>}</label>
          <input name="price" value={form.price} onChange={handleChange} className={inputClass} required={form.variants.length === 0} />
        </div>

        <div>
          <label className={labelClass}>Display Position</label>
          <input name="display_order" type="number" value={form.display_order} onChange={handleChange} placeholder="e.g. 1" className={inputClass} min="1" />
          <p className="mt-2 text-xs text-white/40">Optional homepage order. Clear it from the product table if this product should leave the ordered homepage group.</p>
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

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Specifications</h2>
              <p className="text-xs text-white/40">Edit structured technical rows separately from the product story.</p>
            </div>
            <button type="button" onClick={addSpecificationSection} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600">Add section</button>
          </div>
          {form.specifications.length === 0 && <p className="text-xs text-white/45">No specification sections added.</p>}
          {form.specifications.map((section, sectionIndex) => (
            <div key={sectionIndex} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input value={section.section} onChange={(event) => updateSpecificationSection(sectionIndex, event.target.value)} placeholder="Section e.g. Display" className={inputClass} />
                <button type="button" onClick={() => removeSpecificationSection(sectionIndex)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">Remove</button>
              </div>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input value={item.key} onChange={(event) => updateSpecificationItem(sectionIndex, itemIndex, 'key', event.target.value)} placeholder="Feature e.g. Resolution" className={inputClass} />
                  <input value={item.value} onChange={(event) => updateSpecificationItem(sectionIndex, itemIndex, 'value', event.target.value)} placeholder="Value e.g. 720 x 1576 pixels" className={inputClass} />
                  <button type="button" onClick={() => removeSpecificationItem(sectionIndex, itemIndex)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/10">Remove row</button>
                </div>
              ))}
              <button type="button" onClick={() => addSpecificationItem(sectionIndex)} className="rounded-lg border border-blue-500/30 px-3 py-2 text-xs text-blue-200 hover:bg-blue-500/10">Add row</button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Product Variants</h2>
              <p className="text-xs text-white/40">Edit the active variant list. Omitted saved variants are deactivated by the backend.</p>
            </div>
            <button type="button" onClick={addVariant} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600">Add variant</button>
          </div>
          {form.variants.length === 0 && <p className="text-xs text-white/45">No variants added. The product price is used as the default option.</p>}
          {form.variants.map((variant, index) => (
            <div key={variant.id ?? index} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Variant {index + 1}{index === 0 ? ' · default' : ''}</span>
                <button type="button" onClick={() => removeVariant(index)} className="text-xs text-red-300 hover:text-red-200">Remove</button>
              </div>
              <input value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} placeholder="Name e.g. 4GB RAM / 128GB ROM" className={inputClass} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input value={variant.ram} onChange={(event) => updateVariant(index, 'ram', event.target.value)} placeholder="RAM" className={inputClass} />
                <input value={variant.rom} onChange={(event) => updateVariant(index, 'rom', event.target.value)} placeholder="ROM/Storage" className={inputClass} />
                <input value={variant.color} onChange={(event) => updateVariant(index, 'color', event.target.value)} placeholder="Color" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={variant.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} placeholder="Variant price" className={inputClass} />
                <input value={variant.sku} onChange={(event) => updateVariant(index, 'sku', event.target.value)} placeholder="SKU" className={inputClass} />
              </div>
            </div>
          ))}
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
          </div>
        )}

        <div>
          <label className={labelClass}>Product Images (1 to 7)</label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all" />
          <p className="text-xs text-white/40 mt-2">Existing images are kept in this order. Each picker selection adds new uploads after the current selection.</p>
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
