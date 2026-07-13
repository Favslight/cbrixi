"use client";

import { useEffect, useState } from "react";
import { API_URL, getAdminToken } from "@/lib/api";

interface NotificationEmail {
  id: string;
  email: string;
  label: string;
  created_at?: string;
}

export default function AdminNotificationEmailsPage() {
  const [emails, setEmails] = useState<NotificationEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", label: "" });
  const [message, setMessage] = useState("");

  const fetchEmails = async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/notification-emails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmails(data.emails || data.notification_emails || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const token = getAdminToken();
    try {
      const res = await fetch(`${API_URL}/admin/notification-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ email: "", label: "" });
        setMessage("Email added successfully.");
        fetchEmails();
      } else {
        setMessage(data.message || "Failed to add email.");
      }
    } catch {
      setMessage("Connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this notification email?")) return;
    setDeletingId(id);
    const token = getAdminToken();
    try {
      const res = await fetch(`${API_URL}/admin/notification-emails/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Staff Notification Emails</h1>
        <p className="text-white/50 text-sm">
          These addresses receive alerts for new orders, payments, and pending bank transfers.
        </p>
      </div>

      <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">Add Recipient</h2>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="owner@cbrixi.com"
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Label</label>
          <input
            required
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Primary owner"
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
          />
        </div>
        {message && <p className="text-sm text-blue-300">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Email"}
        </button>
      </form>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Current Recipients</h2>
        {loading ? (
          <div className="text-white/40 animate-pulse">Loading...</div>
        ) : emails.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-8 border border-dashed border-white/10 rounded-xl">
            No notification emails configured yet.
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/30"
              >
                <div>
                  <div className="font-medium">{item.email}</div>
                  <div className="text-sm text-white/50">{item.label}</div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === item.id ? "..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
