"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

export default function AdminReferralsPage() {
  const [settings, setSettings] = useState({ is_enabled: false, bonus_percentage: 0 });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  const [rewards, setRewards] = useState<any[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSettings({
          is_enabled: data.is_enabled ?? false,
          bonus_percentage: Number(data.bonus_percentage ?? 0)
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/payouts?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPayouts(data.payouts || data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRewards(data.rewards || data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRewards(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchPayouts();
    fetchRewards();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/settings`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          is_enabled: settings.is_enabled,
          bonus_percentage: settings.bonus_percentage
        })
      });
      if (res.ok) {
        setSettingsMsg("Settings saved successfully.");
      } else {
        setSettingsMsg("Failed to save settings.");
      }
    } catch (err) {
      setSettingsMsg("Connection error.");
    } finally {
      setSavingSettings(false);
    }
  };

  const approvePayout = async (id: string) => {
    if (!confirm("Are you sure you have sent the money and want to approve this payout?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/payouts/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPayouts(prev => prev.filter(p => p.id !== id));
        alert("Payout approved successfully.");
      } else {
        alert("Failed to approve payout.");
      }
    } catch (err) {
      alert("Error approving payout.");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Referrals Management</h1>
        <p className="text-white/50 text-sm">Configure referral program settings and manage payouts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-6">Settings</h2>
          {loadingSettings ? (
            <div className="text-white/50 animate-pulse">Loading settings...</div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className={`relative w-12 h-6 rounded-full transition-colors ${settings.is_enabled ? 'bg-blue-500' : 'bg-white/10'}`}>
                  <input type="checkbox" className="sr-only" checked={settings.is_enabled} onChange={e => setSettings({...settings, is_enabled: e.target.checked})} />
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.is_enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
                <span className="font-medium text-white/80 group-hover:text-white transition-colors">Enable Referral Program</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bonus Percentage (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={settings.bonus_percentage} 
                  onChange={e => setSettings({...settings, bonus_percentage: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50" 
                />
                <p className="text-xs text-white/40 mt-2">Percentage of successful order effective price awarded to referrer.</p>
              </div>

              {settingsMsg && <div className="text-sm text-blue-300">{settingsMsg}</div>}
              
              <button 
                type="submit" 
                disabled={savingSettings}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </form>
          )}
        </div>

        {/* Payouts and Rewards */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Payouts */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Pending Payout Requests</h2>
            {loadingPayouts ? (
              <div className="text-white/50 animate-pulse">Loading payouts...</div>
            ) : payouts.length === 0 ? (
              <div className="text-center text-white/40 py-8 border border-white/5 rounded-xl border-dashed">No pending payout requests</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="pb-3 font-medium">User / Account</th>
                      <th className="pb-3 font-medium">Bank Details</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payouts.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <div className="font-semibold">{p.account_name}</div>
                          <div className="text-xs text-white/40">Req ID: {p.id.split('-')[0]}</div>
                        </td>
                        <td className="py-4">
                          <div className="font-medium text-white/80">{p.bank_name}</div>
                          <div className="font-mono text-xs text-white/50">{p.account_number}</div>
                        </td>
                        <td className="py-4 font-bold text-blue-400">₦{p.amount}</td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => approvePayout(p.id)}
                            className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Rewards */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Recent Rewards</h2>
            {loadingRewards ? (
              <div className="text-white/50 animate-pulse">Loading rewards...</div>
            ) : rewards.length === 0 ? (
              <div className="text-center text-white/40 py-8 border border-white/5 rounded-xl border-dashed">No rewards tracked yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="pb-3 font-medium">Referrer ID</th>
                      <th className="pb-3 font-medium">Order Amount</th>
                      <th className="pb-3 font-medium">Reward</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rewards.map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-white/70 font-mono text-xs">{r.referrer_id || r.user_id}</td>
                        <td className="py-3 text-white/50">₦{r.order_amount || '0'}</td>
                        <td className="py-3 font-semibold text-green-400">₦{r.amount}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {r.status || 'UNPAID'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
