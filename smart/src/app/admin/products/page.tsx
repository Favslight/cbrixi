'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatMoney, getSellingPrice, hasActiveDiscount } from '@/lib/pricing';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: string | number;
  discount_enabled: boolean;
  discount_percentage: string | number;
  discount_amount: string | number;
  discounted_price: string | number;
  effective_price: string | number;
  display_order?: number | null;
  image?: string;
  image_url?: string | null;
  image_public_id?: string | null;
  image_urls: string[];
  image_public_ids: string[];
  has_variants?: boolean;
  default_variant_id?: string | null;
  variant_price_min?: string | number;
  variant_price_max?: string | number;
  variants?: Array<{
    id: string;
    name: string;
    specs?: Record<string, string | number | boolean>;
    price: string | number;
    effective_price?: string | number;
    is_active?: boolean;
    in_stock?: boolean;
  }>;
  is_active?: boolean;
  in_stock?: boolean;
  status?: 'active' | 'inactive';
}

const normalizeSearch = (value: string | number | boolean | null | undefined) =>
  String(value ?? '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();

const matchesSearch = (query: string, values: Array<string | number | boolean | null | undefined>) => {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeSearch(values.join(' '));
  return terms.every((term) => haystack.includes(term));
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [orderSaving, setOrderSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [stockSavingId, setStockSavingId] = useState<string | null>(null);
  const [bulkDeposit, setBulkDeposit] = useState('');
  const [bulkDiscountEnabled, setBulkDiscountEnabled] = useState<'unchanged' | 'off' | 'on'>('unchanged');
  const [bulkDiscountPercentage, setBulkDiscountPercentage] = useState('');
  const [draggingProductId, setDraggingProductId] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError('Failed to fetch products');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        setError('Failed to delete product');
      }
    } catch {
      setError('Connection error');
    }
  };

  const handleBulkPurchaseSettings = async () => {
    const payload: {
      minimum_deposit_percentage?: number;
      discount_enabled?: boolean;
      discount_percentage?: number;
    } = {};
    const trimmedDeposit = bulkDeposit.trim();
    if (trimmedDeposit) {
      const deposit = Number(trimmedDeposit);
      if (!Number.isInteger(deposit) || deposit < 0 || deposit > 100) {
        setError('Deposit percentage must be an integer between 0 and 100.');
        setSuccess('');
        return;
      }
      payload.minimum_deposit_percentage = deposit;
    }

    if (bulkDiscountEnabled !== 'unchanged') {
      payload.discount_enabled = bulkDiscountEnabled === 'on';
      if (payload.discount_enabled) {
        const discount = Number(bulkDiscountPercentage);
        if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
          setError('Discount percentage must be greater than 0 and less than or equal to 100 when discount is active.');
          setSuccess('');
          return;
        }
        payload.discount_percentage = discount;
      }
    }

    if (Object.keys(payload).length === 0) {
      setError('Choose at least one purchase setting to update.');
      setSuccess('');
      return;
    }

    setBulkSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/products/purchase-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update purchase settings.');
      }
      if (Array.isArray(data.products)) setProducts(data.products);
      else await fetchProducts();
      setSuccess(`Updated ${data.updated_count ?? data.products?.length ?? 0} product purchase settings.`);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Failed to update purchase settings.');
    } finally {
      setBulkSaving(false);
    }
  };

  const isInStock = (product: Product) => product.in_stock !== false;

  const handleStockToggle = async (product: Product) => {
    const nextInStock = !isInStock(product);
    const actionLabel = nextInStock ? 'put back in stock' : 'mark as out of stock';
    if (!confirm(`Are you sure you want to ${actionLabel} "${product.name}"?`)) return;

    setStockSavingId(product.id);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/products/${product.id}/${nextInStock ? 'in-stock' : 'out-of-stock'}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to ${actionLabel}.`);
      }
      const updated = data.product as Product | undefined;
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...(updated ?? {}),
                is_active: updated?.is_active ?? item.is_active ?? true,
                in_stock: updated?.in_stock ?? nextInStock,
              }
            : item
        )
      );
      setSuccess(`${product.name} is now ${nextInStock ? 'in stock' : 'out of stock'}.`);
      await fetchProducts();
    } catch (stockError) {
      setError(stockError instanceof Error ? stockError.message : `Failed to ${actionLabel}.`);
    } finally {
      setStockSavingId(null);
    }
  };

  const getProductImage = (product: Product) => {
    return product.image_url || product.image_urls?.[0] || product.image || '/images/smartwatch.png';
  };

  const getStatus = (product: Product) => {
    if (product.status) return product.status;
    return product.is_active === false ? 'inactive' : 'active';
  };

  const getStockStatus = (product: Product) => (isInStock(product) ? 'in stock' : 'out of stock');

  const getActiveVariantCount = (product: Product) =>
    (Array.isArray(product.variants) ? product.variants : []).filter((variant) => variant.is_active !== false).length;

  const getPriceLabel = (product: Product) => {
    const min = product.variant_price_min ?? product.price;
    const max = product.variant_price_max ?? product.price;
    return String(min) !== String(max) ? `${formatMoney(min)} - ${formatMoney(max)}` : formatMoney(getSellingPrice(product));
  };

  const filteredProducts = products.filter((product) =>
    matchesSearch(search, [
      product.id,
      product.name,
      product.description,
      product.category,
      product.price,
      product.effective_price,
      product.discount_percentage,
      product.display_order,
      getStatus(product),
      getStockStatus(product),
      getPriceLabel(product),
      ...(product.variants ?? []).flatMap((variant) => [
        variant.id,
        variant.name,
        variant.price,
        variant.effective_price,
        ...Object.entries(variant.specs ?? {}).flatMap(([key, value]) => [key, value]),
      ]),
    ])
  );

  const handleDisplayOrderUpdate = async (id: string, rawValue: string) => {
    const trimmed = rawValue.trim();
    const nextOrder = trimmed === '' ? null : Number(trimmed);

    if (nextOrder !== null && (!Number.isFinite(nextOrder) || nextOrder < 1)) {
      setError('Display order must be a positive number, or empty to clear it.');
      return;
    }

    setOrderSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_order: nextOrder }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update display order.');
      }
      await fetchProducts();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update display order.');
    } finally {
      setOrderSaving(false);
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggingProductId || draggingProductId === targetId) {
      setDraggingProductId(null);
      return;
    }

    const fromIndex = products.findIndex((product) => product.id === draggingProductId);
    const toIndex = products.findIndex((product) => product.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggingProductId(null);
      return;
    }

    const nextProducts = [...products];
    const [moved] = nextProducts.splice(fromIndex, 1);
    nextProducts.splice(toIndex, 0, moved);
    setProducts(nextProducts);
    setDraggingProductId(null);

    setOrderSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const product_ids = nextProducts
        .filter((product) => getStatus(product) === 'active')
        .map((product) => product.id);
      const res = await fetch(`${API_URL}/admin/products/display-order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to save dragged product order.');
      }
      await fetchProducts();
    } catch (dropError) {
      setError(dropError instanceof Error ? dropError.message : 'Failed to save dragged product order.');
      await fetchProducts();
    } finally {
      setOrderSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="mt-1 text-sm text-white/45">
              Manage product images, homepage display order, and thumbnails from the dedicated product forms.
            </p>
            {orderSaving && <p className="mt-2 text-xs text-blue-300">Saving display order...</p>}
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-90"
          >
            Add Product
          </Link>
        </div>

        {(error || success) && (
          <div
            className={`mb-4 rounded-lg border p-4 ${
              error
                ? 'border-red-500/50 bg-red-500/20 text-red-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Bulk Purchase Settings</h2>
            <p className="mt-1 text-sm text-white/45">Update deposit requirements or discount state for all uploaded products.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_190px_180px_auto] md:items-end">
            <label>
              <span className="mb-1.5 block text-xs text-white/45">Deposit percentage</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={bulkDeposit}
                onChange={(event) => setBulkDeposit(event.target.value)}
                placeholder="e.g. 30"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs text-white/45">Discounts</span>
              <select
                value={bulkDiscountEnabled}
                onChange={(event) => setBulkDiscountEnabled(event.target.value as typeof bulkDiscountEnabled)}
                className="w-full rounded-xl border border-white/10 bg-[#111116] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              >
                <option value="unchanged">Leave unchanged</option>
                <option value="off">Turn off globally</option>
                <option value="on">Turn on globally</option>
              </select>
            </label>
            {bulkDiscountEnabled === 'on' ? (
              <label>
                <span className="mb-1.5 block text-xs text-white/45">Discount percent</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkDiscountPercentage}
                  onChange={(event) => setBulkDiscountPercentage(event.target.value)}
                  placeholder="e.g. 10"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                />
              </label>
            ) : (
              <div className="hidden md:block" />
            )}
            <button
              type="button"
              onClick={handleBulkPurchaseSettings}
              disabled={bulkSaving}
              className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/25 disabled:opacity-50"
            >
              {bulkSaving ? 'Updating...' : 'Apply to all products'}
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-semibold">
              Products ({filteredProducts.length}
              {filteredProducts.length === products.length ? '' : ` of ${products.length}`})
            </h2>
            <label className="relative w-full lg:max-w-md">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, variants, prices, IDs..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Display Order</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStatus(product);
                  const stockStatus = getStockStatus(product);
                  const imageCount = product.image_urls?.length || (product.image_url ? 1 : 0);
                  const variantCount = getActiveVariantCount(product);

                  return (
                    <tr
                      key={product.id}
                      draggable={getStatus(product) === 'active'}
                      onDragStart={() => setDraggingProductId(product.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(product.id)}
                      onDragEnd={() => setDraggingProductId(null)}
                      className={`border-b border-white/10 ${draggingProductId === product.id ? 'opacity-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-12 h-12 object-contain rounded-lg bg-white"
                          />
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <p className="mt-1 text-xs text-white/40">
                              {imageCount} image{imageCount === 1 ? '' : 's'}
                              {variantCount > 0 ? ` · ${variantCount} variant${variantCount === 1 ? '' : 's'}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.category || 'Uncategorized'}</td>
                      <td className="py-3 px-4">
                        <input
                          key={`${product.id}-${product.display_order ?? 'empty'}`}
                          type="number"
                          min="1"
                          defaultValue={product.display_order ?? ''}
                          disabled={orderSaving}
                          onBlur={(event) => handleDisplayOrderUpdate(product.id, event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                          className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-60"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {hasActiveDiscount(product) ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald-300">{getPriceLabel(product)}</span>
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                {Number(product.discount_percentage)}% OFF
                              </span>
                            </div>
                            <span className="text-xs text-white/40 line-through">{formatMoney(product.price)}</span>
                          </div>
                        ) : (
                          getPriceLabel(product)
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          status !== 'active'
                            ? 'bg-red-500/20 text-red-400'
                            : isInStock(product)
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/15 text-yellow-300'
                        }`}>
                          {status === 'active' ? stockStatus : 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleStockToggle(product)}
                            disabled={stockSavingId === product.id}
                            className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                              isInStock(product)
                                ? 'bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25'
                                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            }`}
                          >
                            {stockSavingId === product.id ? 'Saving...' : isInStock(product) ? 'Out of stock' : 'In stock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {products.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No products found. Add your first product above.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No products match your search.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
