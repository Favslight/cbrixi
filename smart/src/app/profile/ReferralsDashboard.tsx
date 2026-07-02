"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

interface ReferralStats {
  total_referred: number;
  total_earned: number;
  available_balance: number;
  pending_payout_balance: number;
  paid_out_balance: number;
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
  referred_users: any[];
  rewards: any[];
  payout_requests: any[];
}

export default function ReferralsDashboard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ account_name: "", account_number: "", bank_name: "" });
  const [payoutMsg, setPayoutMsg] = useState("");

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/referrals/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.referral);
      } else {
        setError(result.message || "Failed to load referrals");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

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
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payoutForm)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPayoutMsg("Payout request submitted successfully!");
        setPayoutForm({ account_name: "", account_number: "", bank_name: "" });
        fetchReferrals();
      } else {
        setPayoutMsg(result.message || "Payout request failed.");
      }
    } catch {
      setPayoutMsg("Connection error");
    } finally {
      setPayoutLoading(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/auth/signup?ref=${data?.referral_code}`;
    navigator.clipboard.writeText(link);
    alert("Referral link copied!");
  };

  if (loading) return <div className="text-center text-white/50 py-8">Loading referrals...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (!data) return null;

  const refLink = `${window.location.origin}/auth/signup?ref=${data.referral_code}`;

  return (
    <div className="mt-12 space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Refer & Earn</h2>
          <p className="text-white/60 text-sm">
            Invite friends to CBRIXI and earn rewards for every successful order.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4 w-full md:w-auto">
          <div>
            <div className="text-xs text-white/50 mb-1 uppercase tracking-wider font-semibold">Your Code</div>
            <div className="font-mono text-lg font-bold text-blue-400">{data.referral_code}</div>
          </div>
          <button 
            onClick={copyToClipboard}
            className="ml-auto px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium"
          >
            Copy Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Available" value={`₦${data.stats.available_balance}`} color="text-green-400" />
        <StatCard title="Total Earned" value={`₦${data.stats.total_earned}`} />
        <StatCard title="Pending" value={`₦${data.stats.pending_payout_balance}`} color="text-yellow-400" />
        <StatCard title="Friends Invited" value={data.stats.total_referred.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-white/10">
        <div>
          <h3 className="text-xl font-bold mb-4">Request Payout</h3>
          <form onSubmit={handlePayoutSubmit} className="space-y-4 bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Account Name</label>
              <input required type="text" value={payoutForm.account_name} onChange={e => setPayoutForm({...payoutForm, account_name: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Account Number</label>
              <input required type="text" value={payoutForm.account_number} onChange={e => setPayoutForm({...payoutForm, account_number: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Bank Name</label>
              <input required type="text" value={payoutForm.bank_name} onChange={e => setPayoutForm({...payoutForm, bank_name: e.target.value})} className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50" />
            </div>
            {payoutMsg && <div className="text-sm text-center text-blue-300">{payoutMsg}</div>}
            <button 
              type="submit" 
              disabled={payoutLoading || data.stats.available_balance <= 0}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold disabled:opacity-50"
            >
              {payoutLoading ? "Submitting..." : `Withdraw ₦${data.stats.available_balance}`}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Payout History</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {data.payout_requests.length === 0 ? (
              <div className="text-white/40 text-sm text-center py-8 bg-white/5 rounded-2xl border border-white/10">No payout requests yet</div>
            ) : (
              data.payout_requests.map((req, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-medium">₦{req.amount}</div>
                    <div className="text-xs text-white/50">{req.bank_name} - {req.account_number}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
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

function StatCard({ title, value, color = "text-white" }: { title: string, value: string, color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
      <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
