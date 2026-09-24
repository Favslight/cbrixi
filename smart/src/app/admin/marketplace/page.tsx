"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminMarketplaceStatus,
  lockAdminMarketplace,
  MarketplaceStatus,
  unlockAdminMarketplace,
} from "@/lib/marketplace";

const DEFAULT_TITLE = "Marketplace under review";
const DEFAULT_MESSAGE = "Our marketplace is currently under review. Please check back later.";

export default function AdminMarketplacePage() {
  const [status, setStatus] = useState<MarketplaceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchAdminMarketplaceStatus();
      if (cancelled) return;
      if (res.ok && res.status) {
        setStatus(res.status);
        setTitle(res.status.title);
        setMessage(res.status.message);
      } else {
        setNotice({ type: "error", text: res.message || "Could not load marketplace status." });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLock = async () => {
    if (!confirm("Lock the marketplace? Shoppers will see the message below and cannot browse products, add to cart or check out. Existing orders and installment payments are not affected.")) return;
    setBusy(true);
    setNotice(null);
    const res = await lockAdminMarketplace({ title: title.trim(), message: message.trim() });
    if (res.ok && res.status) {
      setStatus(res.status);
      setNotice({ type: "success", text: "Marketplace is now locked." });
    } else {
      setNotice({ type: "error", text: res.message || "Could not lock the marketplace." });
    }
    setBusy(false);
  };

  const handleUnlock = async () => {
    setBusy(true);
    setNotice(null);
    const res = await unlockAdminMarketplace();
    if (res.ok && res.status) {
      setStatus(res.status);
      setNotice({ type: "success", text: "Marketplace is now open to shoppers." });
    } else {
      setNotice({ type: "error", text: res.message || "Could not unlock the marketplace." });
    }
    setBusy(false);
  };

  const locked = status?.locked === true;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Marketplace Access</h1>
        <p className="text-white/50 text-sm">
          Lock the marketplace to show shoppers an &ldquo;under review&rdquo; screen. Unlock it and the marketplace loads again.
          Payments on existing orders keep working while it is locked.
        </p>
      </div>

      {loading ? (
        <div className="text-white/40 animate-pulse">Loading...</div>
      ) : (
        <>
          <div
            className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              locked ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${locked ? "bg-red-400" : "bg-emerald-400"}`} />
                <span className="text-lg font-bold">{locked ? "Marketplace is locked" : "Marketplace is open"}</span>
              </div>
              <p className="text-sm text-white/50 mt-1">
                {locked && status?.locked_at
                  ? `Locked since ${new Date(status.locked_at).toLocaleString()}`
                  : "Shoppers can browse and buy normally."}
              </p>
            </div>
            {locked && (
              <button
                onClick={handleUnlock}
                disabled={busy}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50 transition-colors"
              >
                {busy ? "Unlocking..." : "Unlock Marketplace"}
              </button>
            )}
          </div>

          {notice && (
            <p className={`text-sm ${notice.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{notice.text}</p>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">{locked ? "Update lock message" : "Lock Marketplace"}</h2>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Title</label>
              <input
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Message shown to shoppers</label>
              <textarea
                rows={3}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Preview</p>
              <p className="font-bold">{title.trim() || DEFAULT_TITLE}</p>
              <p className="text-sm text-white/60 mt-1">{message.trim() || DEFAULT_MESSAGE}</p>
            </div>

            <button
              onClick={handleLock}
              disabled={busy}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold disabled:opacity-50"
            >
              {busy ? "Saving..." : locked ? "Update Message" : "Lock Marketplace"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
