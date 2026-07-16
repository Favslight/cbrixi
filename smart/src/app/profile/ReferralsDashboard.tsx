"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

const PAGE_SIZE = 20;

interface ReferralStats {
  total_referred: number;
  total_earned: number;
  available_balance: number;
  pending_payout_balance: number;
  paid_out_balance: number;
}

interface ReferredUser {
  id: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  created_at: string;
  total_purchase_amount: number;
  total_reward_amount: number;
  available_reward_amount: number;
  reward_count: number;
}

interface ReferralReward {
  id: string;
  amount: string | number;
  order_amount?: string | number;
  status?: string;
  created_at?: string;
}

interface PayoutRequest {
  id: string;
  amount: string | number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name?: string;
  created_at?: string;
}

interface ReferralPagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

interface ReferralData {
  settings: {
    is_enabled: boolean;
    bonus_percentage: string;
  };
  referral_code: string;
  referral_link: string;
  referral_count: number;
  stats: ReferralStats;
  referred_users: ReferredUser[];
  referred_users_pagination?: ReferralPagination;
  rewards: ReferralReward[];
  payout_requests: PayoutRequest[];
}

export default function ReferralsDashboard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ account_name: "", account_number: "", bank_name: "" });
  const [payoutMsg, setPayoutMsg] = useState("");
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [pagination, setPagination] = useState<ReferralPagination | null>(null);
  const [copyMsg, setCopyMsg] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const fetchReferrals = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/referrals/me?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const referral: ReferralData = result.referral;
        setData(referral);
        setReferredUsers((prev) =>
          append ? [...prev, ...(referral.referred_users || [])] : referral.referred_users || []
        );
        setPagination(referral.referred_users_pagination ?? null);
        setError("");
      } else {
        setError(result.message || "Failed to load referrals");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals(0, false);
  }, [fetchReferrals]);

  const handleLoadMore = () => {
    if (!pagination?.has_more || loadingMore) return;
    fetchReferrals(pagination.offset + pagination.limit, true);
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || data.stats.available_balance <= 0) return;

    setPayoutLoading(true);
    setPayoutMsg("");

    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/referrals/payout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payoutForm),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const amount = result.payout?.amount ?? data.stats.available_balance;
        setPayoutMsg(`Payout request pending — ₦${Number(amount).toLocaleString()} submitted.`);
        setPayoutForm({ account_name: "", account_number: "", bank_name: "" });
        fetchReferrals(0, false);
      } else {
        setPayoutMsg(result.message || "Payout request failed.");
      }
    } catch {
      setPayoutMsg("Connection error");
    } finally {
      setPayoutLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("Copy failed");
    }
  };

  const shareLink = async (link: string, code: string) => {
    const shareData = {
      title: "Join CBRIXI",
      text: `Sign up on CBRIXI with my referral code ${code}`,
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMsg("Shared!");
      } else {
        await navigator.clipboard.writeText(link);
        setShareMsg("Link copied");
      }
      setTimeout(() => setShareMsg(""), 2000);
    } catch {
      // user cancelled share — ignore
    }
  };

  if (loading) return <div className="text-center text-white/50 py-8">Loading referrals...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (!data) return null;

  const refLink = data.referral_link || `${window.location.origin}/signup?ref=${data.referral_code}`;
  const totalInvited = data.referral_count ?? data.stats.total_referred;
  const available = Number(data.stats.available_balance ?? 0);

  return (
    <div className="mt-12 space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Refer & Earn</h2>
          <p className="text-white/60 text-sm">
            Invite friends to CBRIXI and earn {data.settings.bonus_percentage}% rewards on their purchases.
            {!data.settings.is_enabled && (
              <span className="block text-yellow-400/80 mt-1">Referral rewards are currently paused.</span>
            )}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-3 w-full md:w-auto min-w-[260px]">
          <div>
            <div className="text-xs text-white/50 mb-1 uppercase tracking-wider font-semibold">Your Code</div>
            <div className="font-mono text-lg font-bold text-blue-400">{data.referral_code}</div>
            <div className="text-xs text-white/40 mt-1 break-all">{refLink}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(refLink)}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium"
            >
              {copyMsg || "Copy Link"}
            </button>
            <button
              type="button"
              onClick={() => shareLink(refLink, data.referral_code)}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors text-sm font-medium border border-white/10"
            >
              {shareMsg || "Share"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Available" value={`₦${available.toLocaleString()}`} color="text-green-400" />
        <StatCard title="Total Earned" value={`₦${Number(data.stats.total_earned).toLocaleString()}`} />
        <StatCard title="Pending Payout" value={`₦${Number(data.stats.pending_payout_balance).toLocaleString()}`} color="text-yellow-400" />
        <StatCard title="Paid Out" value={`₦${Number(data.stats.paid_out_balance ?? 0).toLocaleString()}`} color="text-blue-300" />
        <StatCard title="Friends Invited" value={totalInvited.toString()} />
      </div>

      {/* Invited Friends */}
      <section className="pt-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Invited Friends</h3>
          {pagination && (
            <span className="text-sm text-white/40">
              {referredUsers.length} of {pagination.total}
            </span>
          )}
        </div>
        {referredUsers.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-8 bg-white/5 rounded-2xl border border-white/10">
            No friends invited yet. Share your link to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {referredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium">{user.name || `${user.firstname} ${user.lastname}`}</div>
                  <div className="text-sm text-white/50">{user.email}</div>
                  <div className="text-xs text-white/35 mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-green-400 font-semibold">₦{Number(user.total_reward_amount).toLocaleString()} earned</div>
                  <div className="text-white/40 text-xs">{user.reward_count} reward{user.reward_count !== 1 ? "s" : ""}</div>
                </div>
              </div>
            ))}
            {pagination?.has_more && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 mt-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more friends"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Reward History */}
      <section className="pt-6 border-t border-white/10">
        <h3 className="text-xl font-bold mb-4">Reward History</h3>
        {data.rewards.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-8 bg-white/5 rounded-2xl border border-white/10">
            No rewards yet. Rewards appear after your friends complete payments.
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {data.rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-green-400">+₦{Number(reward.amount).toLocaleString()}</div>
                  {reward.order_amount != null && (
                    <div className="text-xs text-white/50">From order ₦{Number(reward.order_amount).toLocaleString()}</div>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      reward.status === "PAID"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {reward.status || "AVAILABLE"}
                  </span>
                  {reward.created_at && (
                    <div className="text-xs text-white/35 mt-1">
                      {new Date(reward.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-white/10">
        <div>
          <h3 className="text-xl font-bold mb-4">Request Payout</h3>
          <form onSubmit={handlePayoutSubmit} className="space-y-4 bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Account Name</label>
              <input
                required
                type="text"
                value={payoutForm.account_name}
                onChange={(e) => setPayoutForm({ ...payoutForm, account_name: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Account Number</label>
              <input
                required
                type="text"
                value={payoutForm.account_number}
                onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Bank Name</label>
              <input
                required
                type="text"
                value={payoutForm.bank_name}
                onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
              />
            </div>
            {payoutMsg && <div className="text-sm text-center text-blue-300">{payoutMsg}</div>}
            {available <= 0 && (
              <p className="text-xs text-white/40 text-center">You need an available balance to request a payout.</p>
            )}
            <button
              type="submit"
              disabled={payoutLoading || available <= 0}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold disabled:opacity-50"
            >
              {payoutLoading ? "Submitting..." : `Withdraw ₦${available.toLocaleString()}`}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Payout History</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {data.payout_requests.length === 0 ? (
              <div className="text-white/40 text-sm text-center py-8 bg-white/5 rounded-2xl border border-white/10">
                No payout requests yet
              </div>
            ) : (
              data.payout_requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">₦{Number(req.amount).toLocaleString()}</div>
                    <div className="text-xs text-white/50">
                      {req.bank_name} - {req.account_number}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      req.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {req.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-white" }: { title: string; value: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
      <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
