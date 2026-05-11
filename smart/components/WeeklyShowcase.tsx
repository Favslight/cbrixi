'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface ProductLike {
  id: string;
  name?: string;
  image?: string;
  image_url?: string;
  image_urls?: string[];
}

function getWeekSeed(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const now = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.floor(day / 7);
}

function pickImage(product: ProductLike) {
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls[0];
  if (product.image_url) return product.image_url;
  if (product.image) return product.image;
  return '/images/smartwatch.png';
}

export default function WeeklyShowcase() {
  const [products, setProducts] = useState<ProductLike[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
        const data = await res.json();
        const list = Array.isArray(data?.products) ? data.products : [];
        setProducts(list);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_URL]);

  const selected = useMemo(() => {
    if (!products.length) return [];
    const seed = getWeekSeed();
    const pool = [...products];
    const out: ProductLike[] = [];
    for (let i = 0; i < Math.min(3, pool.length); i += 1) {
      const idx = (seed + i) % pool.length;
      out.push(pool[idx]);
    }
    return out;
  }, [products]);

  if (loading || selected.length === 0) return null;

  const [left, topRight, bottomRight] = [
    selected[0],
    selected[1] || selected[0],
    selected[2] || selected[0],
  ];

  const Card = ({
    product,
    title,
    className,
  }: {
    product: ProductLike;
    title: string;
    className: string;
  }) => (
    <article className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pickImage(product)} alt={product.name || title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#060f31]/80 via-[#0a1538]/55 to-transparent" />
      <div className="absolute left-0 bottom-0 z-10">
        <div className="w-[70%] h-[50%] min-h-[72px] rounded-tr-xl bg-[#0a1538]/84 backdrop-blur-sm border-t border-r border-white/15 px-4 py-3">
          <h3 className="text-white font-semibold text-lg sm:text-2xl">{title}</h3>
          <Link
            href="/marketplace"
            className="mt-3 inline-flex items-center justify-center rounded-md border border-white/60 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            EXPLORE ITEMS
          </Link>
        </div>
      </div>
    </article>
  );

  return (
    <section className="relative z-10 mt-2 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <Card product={left} title="Bestseller Products" className="min-h-[130px] lg:min-h-[170px]" />
          <div className="grid grid-rows-2 gap-4 sm:gap-5">
            <Card product={topRight} title="Top Product Of the Week" className="min-h-[62px] sm:min-h-[80px]" />
            <Card product={bottomRight} title="Featured Products" className="min-h-[62px] sm:min-h-[80px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
