'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Campaign, CampaignPlacement } from '@/lib/campaigns';
import { fetchHomepageCampaigns, recordCampaignView } from '@/lib/campaigns';
import CampaignContent from './CampaignContent';

interface HeroBannerProps {
  className?: string;
  /** Rotation interval in ms (default 5000) */
  intervalMs?: number;
}

export default function HeroBanner({ className = '', intervalMs = 5000 }: HeroBannerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [index, setIndex] = useState(0);
  const viewedIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetchHomepageCampaigns('HERO_BANNER').then((list) => {
      if (!cancelled) setCampaigns(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % campaigns.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [campaigns, intervalMs]);

  useEffect(() => {
    const current = campaigns[index];
    if (!current || viewedIds.current.has(current.id)) return;
    viewedIds.current.add(current.id);
    recordCampaignView(current.id).catch(() => undefined);
  }, [campaigns, index]);

  if (!campaigns.length) return null;

  const campaign = campaigns[index];
  const isMedia = campaign.campaign_type === 'IMAGE' || campaign.campaign_type === 'VIDEO';

  return (
    <section className={`relative w-full overflow-hidden ${className}`} aria-label="Featured campaign">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-950/40 via-[#0c0c12] to-purple-950/30 min-h-[160px] sm:min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.45 }}
              className="relative"
            >
              {isMedia ? (
                <div className="relative aspect-[21/9] max-h-[280px] w-full">
                  <CampaignContent campaign={campaign} className="absolute inset-0" mediaClassName="absolute inset-0" />
                </div>
              ) : (
                <div className="flex items-center px-6 py-8 sm:px-10 sm:py-10">
                  <CampaignContent campaign={campaign} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {campaigns.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {campaigns.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Show campaign ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-blue-400' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface PlacementBannerProps {
  placement: Exclude<CampaignPlacement, 'LANDING_POPUP' | 'HERO_BANNER'>;
  className?: string;
  /** Show only the highest-priority campaign (default true for strip banners) */
  single?: boolean;
  compact?: boolean;
}

export function PlacementBanner({
  placement,
  className = '',
  single = true,
  compact = false,
}: PlacementBannerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const viewedIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetchHomepageCampaigns(placement).then((list) => {
      if (!cancelled) setCampaigns(single ? list.slice(0, 1) : list);
    });
    return () => {
      cancelled = true;
    };
  }, [placement, single]);

  useEffect(() => {
    campaigns.forEach((c) => {
      if (viewedIds.current.has(c.id)) return;
      viewedIds.current.add(c.id);
      recordCampaignView(c.id).catch(() => undefined);
    });
  }, [campaigns]);

  if (!campaigns.length) return null;

  const shellByPlacement: Record<string, string> = {
    TOP_BANNER: 'border-b border-white/8 bg-gradient-to-r from-blue-600/15 via-transparent to-purple-600/15',
    BOTTOM_BANNER: 'border-t border-white/8 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10',
    CATEGORY_PAGE: 'rounded-2xl border border-white/10 bg-white/[0.03]',
    PRODUCT_PAGE: 'rounded-2xl border border-white/10 bg-white/[0.03]',
    SIDEBAR: 'rounded-xl border border-white/10 bg-white/[0.04]',
    FOOTER: 'rounded-xl border border-white/8 bg-white/[0.02]',
  };

  return (
    <div className={`w-full ${shellByPlacement[placement] || ''} ${className}`} data-placement={placement}>
      <div className={`mx-auto max-w-7xl ${compact ? 'px-3 py-2' : 'px-4 sm:px-6 lg:px-8 py-3'}`}>
        {campaigns.map((campaign) => {
          const isMedia = campaign.campaign_type === 'IMAGE' || campaign.campaign_type === 'VIDEO';
          return (
            <div key={campaign.id} className="relative overflow-hidden">
              {isMedia ? (
                <div className={`relative w-full overflow-hidden rounded-lg ${compact ? 'h-14' : placement === 'SIDEBAR' ? 'aspect-[4/5] max-h-72' : 'h-28 sm:h-36'}`}>
                  <CampaignContent campaign={campaign} className="absolute inset-0" mediaClassName="absolute inset-0" compact={compact} />
                </div>
              ) : (
                <CampaignContent campaign={campaign} compact={compact || placement === 'TOP_BANNER'} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
