'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Campaign } from '@/lib/campaigns';
import { fetchHomepageCampaigns, recordCampaignView } from '@/lib/campaigns';
import CampaignContent from './CampaignContent';
import CountdownTimer from './CountdownTimer';

const DISMISS_KEY = 'cbrixi_landing_popup_dismissed';

export default function CampaignPopup() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [visible, setVisible] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);
  const viewedRef = useRef(false);

  const close = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
      } catch {
        // ignore
      }

      const campaigns = await fetchHomepageCampaigns('LANDING_POPUP');
      if (cancelled || !campaigns.length) return;

      const top = campaigns[0];
      setCampaign(top);

      const delayMs = Math.max(0, (top.popup_delay_seconds ?? 0) * 1000);
      delayTimer = setTimeout(() => {
        if (!cancelled) {
          setReadyToShow(true);
          setVisible(true);
        }
      }, delayMs);
    };

    run();
    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible || !campaign || viewedRef.current) return;
    viewedRef.current = true;
    recordCampaignView(campaign.id).catch(() => undefined);
  }, [visible, campaign]);

  useEffect(() => {
    if (!visible || !campaign) return;
    const skipAfter = campaign.allow_skip_after_seconds ?? 0;
    if (skipAfter <= 0) {
      setCanSkip(true);
      return;
    }
    setCanSkip(false);
    const id = window.setTimeout(() => setCanSkip(true), skipAfter * 1000);
    return () => window.clearTimeout(id);
  }, [visible, campaign]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!campaign || !readyToShow) return null;

  const displayDuration = campaign.display_duration_seconds ?? 0;
  const skipAfter = campaign.allow_skip_after_seconds ?? 0;
  const isMedia = campaign.campaign_type === 'IMAGE' || campaign.campaign_type === 'VIDEO';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="campaign-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={campaign.title || 'Announcement'}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl shadow-black/60"
          >
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              {displayDuration > 0 && (
                <CountdownTimer
                  seconds={displayDuration}
                  onComplete={close}
                  resetKey={campaign.id}
                  variant="ring"
                />
              )}
              {canSkip ? (
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  Skip
                </button>
              ) : (
                skipAfter > 0 && (
                  <CountdownTimer
                    seconds={skipAfter}
                    label="Skip in"
                    variant="badge"
                    resetKey={`skip-${campaign.id}`}
                  />
                )
              )}
            </div>

            <div className={isMedia ? 'relative aspect-[4/5] sm:aspect-video bg-black' : 'p-6 pt-14'}>
              <CampaignContent
                campaign={campaign}
                className={isMedia ? 'absolute inset-0' : ''}
                mediaClassName="absolute inset-0"
              />
            </div>

            {!isMedia && campaign.campaign_type !== 'TEXT' && (
              <div className="border-t border-white/8 px-5 py-4">
                <CampaignContent campaign={campaign} compact />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
