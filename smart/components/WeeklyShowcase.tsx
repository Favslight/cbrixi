'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney, getSellingPrice } from '@/lib/pricing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

interface ShowcaseProduct {
  id: string;
  name: string;
  image: string;
  price: string | number;
  discounted_price?: string | number;
  effective_price?: string | number;
  discount_enabled?: boolean;
  discount_percentage?: string | number;
}

const TITLES = ['Bestseller Product', 'Top Product', 'Featured Product'] as const;

export default function WeeklyShowcase() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        const list = (data.products || []).slice(0, 3).map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image_url || p.image || '/images/smartwatch.png',
          price: p.price ?? 0,
          discounted_price: p.discounted_price,
          effective_price: p.effective_price,
          discount_enabled: p.discount_enabled,
          discount_percentage: p.discount_percentage,
        }));
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const Card = ({
    product,
    title,
    className,
  }: {
    product: ShowcaseProduct;
    title: string;
    className: string;
  }) => (
    <article className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#060f31]/80 via-[#0a1538]/55 to-transparent" />
      <div className="absolute left-0 bottom-0 z-10">
        <div className="w-[70%] h-[50%] min-h-[72px] rounded-tr-xl bg-[#0a1538]/84 backdrop-blur-sm border-t border-r border-white/15 px-4 py-3">
          <h3 className="text-white font-semibold text-lg sm:text-2xl">{title}</h3>
          <p className="mt-1 text-sm text-white/70 truncate">{product.name}</p>
          <p className="mt-0.5 text-sm font-bold text-blue-200">{formatMoney(getSellingPrice(product))}</p>
          <Link
            href={`/product/${product.id}`}
            className="mt-3 inline-flex items-center justify-center rounded-md border border-white/60 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            EXPLORE ITEMS
          </Link>
        </div>
      </div>
    </article>
  );

  if (loading) {
    return (
      <section className="relative z-10 mt-2 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center py-12">
          <svg className="w-7 h-7 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return (
      <section className="relative z-10 mt-2 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-10">
          <p className="text-white/50 text-sm">
            {error ? 'Could not load featured products.' : 'No featured products available yet.'}
          </p>
          <Link href="/marketplace" className="mt-3 inline-block text-blue-400 text-sm font-semibold hover:text-blue-300">
            Browse marketplace
          </Link>
        </div>
      </section>
    );
  }

  const [left, topRight, bottomRight] = products;

  return (
    <section className="relative z-10 mt-2 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {left && <Card product={left} title={TITLES[0]} className="min-h-[130px] lg:min-h-[170px]" />}
          {(topRight || bottomRight) && (
            <div className="grid grid-rows-2 gap-4 sm:gap-5">
              {topRight && <Card product={topRight} title={TITLES[1]} className="min-h-[62px] sm:min-h-[80px]" />}
              {bottomRight && <Card product={bottomRight} title={TITLES[2]} className="min-h-[62px] sm:min-h-[80px]" />}
              {!bottomRight && topRight && <div className="min-h-[62px] sm:min-h-[80px]" aria-hidden />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
