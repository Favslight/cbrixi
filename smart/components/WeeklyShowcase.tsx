'use client';

import Link from 'next/link';

interface ProductLike {
  id: string;
  name: string;
  image: string;
}

const SHOWCASE_PRODUCTS: ProductLike[] = [
  { id: 'bestseller-iphone', name: 'iPhone', image: '/images/iphone.png' },
  { id: 'top-product-laptop', name: 'Laptop', image: '/images/laptop.png' },
  { id: 'featured-electric-bike', name: 'Electric Bike', image: '/images/electric-bike.png' },
];

export default function WeeklyShowcase() {
  const [left, topRight, bottomRight] = SHOWCASE_PRODUCTS;

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
      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
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
          <Card product={left} title="Bestseller Product" className="min-h-[130px] lg:min-h-[170px]" />
          <div className="grid grid-rows-2 gap-4 sm:gap-5">
            <Card product={topRight} title="Top Product" className="min-h-[62px] sm:min-h-[80px]" />
            <Card product={bottomRight} title="Featured Product" className="min-h-[62px] sm:min-h-[80px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
