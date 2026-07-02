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
  image?: string;
  image_url?: string | null;
  image_public_id?: string | null;
  image_urls: string[];
  image_public_ids: string[];
  stock: number;
  is_active?: boolean;
  status?: 'active' | 'inactive';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const getProductImage = (product: Product) => {
    return product.image_url || product.image_urls?.[0] || product.image || '/images/smartwatch.png';
  };

  const getStatus = (product: Product) => {
    if (product.status) return product.status;
    return product.is_active === false ? 'inactive' : 'active';
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
              Manage product images, order, and thumbnails from the dedicated product forms.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-90"
          >
            Add Product
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Stock</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStatus(product);
                  const imageCount = product.image_urls?.length || (product.image_url ? 1 : 0);

                  return (
                    <tr key={product.id} className="border-b border-white/10">
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
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.category || 'Uncategorized'}</td>
                      <td className="py-3 px-4">
                        {hasActiveDiscount(product) ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald-300">{formatMoney(getSellingPrice(product))}</span>
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                {Number(product.discount_percentage)}% OFF
                              </span>
                            </div>
                            <span className="text-xs text-white/40 line-through">{formatMoney(product.price)}</span>
                          </div>
                        ) : (
                          formatMoney(product.price)
                        )}
                      </td>
                      <td className="py-3 px-4">{product.stock}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {status}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-8 text-white/50">
                No products found. Add your first product above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
