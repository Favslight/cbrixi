"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

type PayoutStatusFilter = "PENDING" | "APPROVED" | "ALL";

type Payout = {
  id: string;
  amount: string | number;
  status: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  email?: string;
  user_email?: string;
  created_at?: string;
};

type Reward = {
  id?: string;
  referrer_id?: string;
  user_id?: string;
  referrer_email?: string;
  order_amount?: string | number;
  amount?: string | number;
  status?: string;
  created_at?: string;
};

function authHeaders() {
  const token = localStorage.getItem("adminToken") ?? "";
  return { Authorization: `Bearer ${token}` };
}

export default function AdminReferralsPage() {
  const [settings, setSettings] = useState({ is_enabled: false, bonus_percentage: 0 });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const [payoutStatus, setPayoutStatus] = useState<PayoutStatusFilter>("PENDING");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);

  const [rebuildEmail, setRebuildEmail] = useState("");
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState("");

  const [creditForm, setCreditForm] = useState({ referrer_email: "", reward_amount: "", note: "" });
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditMsg, setCreditMsg] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/referrals/settings`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        const src = data.settings ?? data;
        setSettings({
          is_enabled: Boolean(src.is_enabled),
          bonus_percentage: Number(src.bonus_percentage ?? 0),
        });
      }
    } catch {
      // ignore
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchPayouts = useCallback(async (status: PayoutStatusFilter) => {
    setLoadingPayouts(true);
    try {
      const query = status === "ALL" ? "" : `?status=${status}`;
      const res = await fetch(`${API_URL}/admin/referrals/payouts${query}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setPayouts(data.payouts || data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPayouts(false);
    }
  }, []);

  const fetchRewards = useCallback(async () => {
    setLoadingRewards(true);
    try {
      const res = await fetch(`${API_URL}/admin/referrals/rewards`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setRewards(data.rewards || data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRewards(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchRewards();
  }, [fetchSettings, fetchRewards]);

  useEffect(() => {
    fetchPayouts(payoutStatus);
  }, [payoutStatus, fetchPayouts]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      const res = await fetch(`${API_URL}/admin/referrals/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          is_enabled: settings.is_enabled,
          bonus_percentage: settings.bonus_percentage,
        }),
      });
      if (res.ok) {
        setSettingsMsg("Settings saved successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        setSettingsMsg(data.message || "Failed to save settings.");
      }
    } catch {
      setSettingsMsg("Connection error.");
    } finally {
      setSavingSettings(false);
    }
  };

  const approvePayout = async (id: string) => {
    if (!confirm("Confirm you have sent the money and want to approve this payout?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/referrals/payouts/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        setPayouts((prev) => prev.filter((p) => p.id !== id));
        fetchRewards();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to approve payout.");
      }
    } catch {
      alert("Error approving payout.");
    }
  };

  const handleRebuild = async (rebuildAll = false) => {
    setRebuildLoading(true);
    setRebuildMsg("");
    try {
      const body = rebuildAll
        ? {}
        : rebuildEmail.trim()
          ? { referrer_email: rebuildEmail.trim() }
          : null;

      if (!rebuildAll && !body) {
        setRebuildMsg("Enter a referrer email, or rebuild all.");
        setRebuildLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/admin/referrals/rebuild-rewards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        const count = data.restored_count ?? 0;
        setRebuildMsg(`Rebuild complete. Restored ${count} reward${count === 1 ? "" : "s"}. Ask the user to refresh their referrals page.`);
        fetchRewards();
      } else {
        setRebuildMsg(data.message || "Rebuild failed.");
      }
    } catch {
      setRebuildMsg("Connection error.");
    } finally {
      setRebuildLoading(false);
    }
  };

  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditLoading(true);
    setCreditMsg("");
    try {
      const res = await fetch(`${API_URL}/admin/referrals/rewards/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          referrer_email: creditForm.referrer_email.trim(),
          reward_amount: Number(creditForm.reward_amount),
          note: creditForm.note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setCreditMsg("Manual credit applied. Ask the user to refresh GET /referrals/me.");
        setCreditForm({ referrer_email: "", reward_amount: "", note: "" });
        fetchRewards();
      } else {
        setCreditMsg(data.message || "Credit failed.");
      }
    } catch {
      setCreditMsg("Connection error.");
    } finally {
      setCreditLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Referrals Management</h1>
        <p className="text-white/50 text-sm">Configure referral settings, approve payouts, and restore missing rewards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Settings</h2>
            {loadingSettings ? (
              <div className="text-white/50 animate-pulse">Loading settings...</div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${settings.is_enabled ? "bg-blue-500" : "bg-white/10"}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.is_enabled}
                      onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                    />
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.is_enabled ? "translate-x-7" : "translate-x-1"}`} />
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
                    onChange={(e) => setSettings({ ...settings, bonus_percentage: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
                  />
                  <p className="text-xs text-white/40 mt-2">
                    Rewards are created only when enabled and bonus &gt; 0. Uses effective/discounted payment amount.
                  </p>
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

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Rebuild Rewards</h2>
            <p className="text-xs text-white/40">
              Use when a user&apos;s balance looks wrong after cleanup/deletes. Restores missing rewards from successful payments.
            </p>
            <input
              type="email"
              placeholder="referrer@example.com (optional)"
              value={rebuildEmail}
              onChange={(e) => setRebuildEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-sm"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={rebuildLoading}
                onClick={() => handleRebuild(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
              >
                {rebuildLoading ? "Rebuilding..." : "Rebuild for email"}
              </button>
              <button
                type="button"
                disabled={rebuildLoading}
                onClick={() => {
                  if (!confirm("Rebuild referral rewards for everyone?")) return;
                  handleRebuild(true);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Rebuild all users
              </button>
            </div>
            {rebuildMsg && <p className="text-xs text-blue-300">{rebuildMsg}</p>}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-2">Manual Credit</h2>
            <p className="text-xs text-white/40 mb-4">
              Credit a balance when auto-rebuild cannot find the original payment or notification.
            </p>
            <form onSubmit={handleCredit} className="space-y-3">
              <input
                required
                type="email"
                placeholder="referrer_email"
                value={creditForm.referrer_email}
                onChange={(e) => setCreditForm({ ...creditForm, referrer_email: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-sm"
              />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="reward_amount"
                value={creditForm.reward_amount}
                onChange={(e) => setCreditForm({ ...creditForm, reward_amount: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-sm"
              />
              <input
                type="text"
                placeholder="note (optional)"
                value={creditForm.note}
                onChange={(e) => setCreditForm({ ...creditForm, note: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-sm"
              />
              {creditMsg && <p className="text-xs text-blue-300">{creditMsg}</p>}
              <button
                type="submit"
                disabled={creditLoading}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {creditLoading ? "Crediting..." : "Credit balance"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold">Payout Requests</h2>
              <div className="flex gap-2">
                {(["PENDING", "APPROVED", "ALL"] as PayoutStatusFilter[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPayoutStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      payoutStatus === status
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "text-white/50 border border-white/10 hover:text-white"
                    }`}
                  >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            {loadingPayouts ? (
              <div className="text-white/50 animate-pulse">Loading payouts...</div>
            ) : payouts.length === 0 ? (
              <div className="text-center text-white/40 py-8 border border-white/5 rounded-xl border-dashed">
                No {payoutStatus === "ALL" ? "" : payoutStatus.toLowerCase() + " "}payout requests
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="pb-3 font-medium">User / Account</th>
                      <th className="pb-3 font-medium">Bank Details</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4">
                          <div className="font-semibold">{p.account_name || "—"}</div>
                          <div className="text-xs text-white/40">{p.email || p.user_email || `ID: ${p.id.slice(0, 8)}`}</div>
                        </td>
                        <td className="py-4">
                          <div className="font-medium text-white/80">{p.bank_name}</div>
                          <div className="font-mono text-xs text-white/50">{p.account_number}</div>
                        </td>
                        <td className="py-4 font-bold text-blue-400">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {p.status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => approvePayout(p.id)}
                              className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-bold transition-colors"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-white/30 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
                      <th className="pb-3 font-medium">Referrer</th>
                      <th className="pb-3 font-medium">Order Amount</th>
                      <th className="pb-3 font-medium">Reward</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rewards.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-white/70 font-mono text-xs">
                          {r.referrer_email || r.referrer_id || r.user_id || "—"}
                        </td>
                        <td className="py-3 text-white/50">₦{Number(r.order_amount || 0).toLocaleString()}</td>
                        <td className="py-3 font-semibold text-green-400">₦{Number(r.amount || 0).toLocaleString()}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              r.status === "PAID"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {r.status || "AVAILABLE"}
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
