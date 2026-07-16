'use client';

import Link from 'next/link';
import type { Campaign } from '@/lib/campaigns';
import { productImage } from '@/lib/campaigns';
import { formatMoney, getSellingPrice, hasActiveDiscount, type ProductDiscountFields } from '@/lib/pricing';

interface CampaignContentProps {
  campaign: Campaign;
  className?: string;
  mediaClassName?: string;
  compact?: boolean;
}

/** Renders IMAGE / VIDEO / TEXT / PROMOTED_PRODUCT — no external links or click tracking */
export default function CampaignContent({
  campaign,
  className = '',
  mediaClassName = '',
  compact = false,
}: CampaignContentProps) {
  const type = campaign.campaign_type;

  if (type === 'VIDEO' && campaign.media_url) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <video
          src={campaign.media_url}
          poster={campaign.thumbnail_url || undefined}
          className={`w-full h-full object-cover ${mediaClassName}`}
          autoPlay
          muted
          playsInline
          loop
        />
        {(campaign.title || campaign.description) && (
          <div className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent ${compact ? 'p-3' : 'p-5'}`}>
            {campaign.title && <p className={`font-bold text-white ${compact ? 'text-sm' : 'text-lg'}`}>{campaign.title}</p>}
            {campaign.description && !compact && (
              <p className="mt-1 text-sm text-white/70 line-clamp-2">{campaign.description}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === 'IMAGE' && campaign.media_url) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={campaign.media_url}
          alt={campaign.title || 'Campaign'}
          className={`w-full h-full object-cover ${mediaClassName}`}
        />
        {(campaign.title || campaign.description) && (
          <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent ${compact ? 'p-3' : 'p-5'}`}>
            {campaign.title && <p className={`font-bold text-white ${compact ? 'text-sm' : 'text-lg'}`}>{campaign.title}</p>}
            {campaign.description && !compact && (
              <p className="mt-1 text-sm text-white/70 line-clamp-2">{campaign.description}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === 'PROMOTED_PRODUCT') {
    const product = campaign.product;
    const img = productImage(product);
    const name = product?.name || campaign.title;
    const href = product?.id || campaign.product_id ? `/product/${product?.id || campaign.product_id}` : null;
    const priceFields: ProductDiscountFields | null = product?.price != null
      ? {
          price: product.price,
          discount_enabled: product.discount_enabled,
          discount_percentage: product.discount_percentage,
          discounted_price: product.discounted_price,
          effective_price: product.effective_price,
        }
      : null;

    const body = (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className={`relative shrink-0 overflow-hidden rounded-xl bg-white/5 ${compact ? 'h-16 w-16' : 'h-24 w-24'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={name || 'Product'} className="h-full w-full object-contain p-1" />
        </div>
        <div className="min-w-0 flex-1">
          {campaign.title && campaign.title !== name && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1">{campaign.title}</p>
          )}
          <p className={`font-bold text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>{name}</p>
          {campaign.description && !compact && (
            <p className="mt-1 text-sm text-white/55 line-clamp-2">{campaign.description}</p>
          )}
          {priceFields && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-300">{formatMoney(getSellingPrice(priceFields))}</span>
              {hasActiveDiscount(priceFields) && (
                <span className="text-xs text-white/40 line-through">{formatMoney(priceFields.price)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="block hover:opacity-95 transition-opacity">
          {body}
        </Link>
      );
    }
    return body;
  }

  // TEXT (default)
  return (
    <div className={className}>
      {campaign.title && (
        <h3 className={`font-bold text-white ${compact ? 'text-base' : 'text-xl sm:text-2xl'}`}>{campaign.title}</h3>
      )}
      {campaign.description && (
        <p className={`mt-2 text-white/65 leading-relaxed ${compact ? 'text-xs line-clamp-3' : 'text-sm sm:text-base'}`}>
          {campaign.description}
        </p>
      )}
    </div>
  );
}
