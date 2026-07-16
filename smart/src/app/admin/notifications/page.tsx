"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

type StatusFilter = "all" | "read" | "unread";

type Notification = {
  id: string;
  target_type?: "USER" | "ADMIN";
  user_id?: string | null;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

type BroadcastForm = {
  title: string;
  message: string;
  type: string;
  target_user_id?: string;
  is_global: boolean;
};

function authHeaders() {
  const token = localStorage.getItem("adminToken") ?? "";
  return { Authorization: `Bearer ${token}` };
}

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<"inbox" | "broadcast">("inbox");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BroadcastForm>({
    title: "",
    message: "",
    type: "INFO",
    target_user_id: "",
    is_global: true,
  });
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/notifications/unread-count`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setUnreadCount(data.count ?? data.unread_count ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/notifications?status=${status}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.message || "Failed to load notifications");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchNotifications();
    fetchUnread();
  }, [fetchNotifications, fetchUnread]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        fetchUnread();
      }
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/notifications/read-all`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/admin/notifications/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        fetchUnread();
      }
    } catch {
      // keep item until delete succeeds
    } finally {
      setDeletingId(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendMsg("");
    try {
      const res = await fetch(`${API_URL}/admin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setSendMsg("Notification sent successfully!");
        setFormData({ title: "", message: "", type: "INFO", target_user_id: "", is_global: true });
      } else {
        setSendMsg(data.message || "Failed to send notification.");
      }
    } catch {
      setSendMsg("Connection error.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Notifications</h1>
          <p className="text-white/50 text-sm">Admin inbox and user broadcast messages.</p>
        </div>
        {unreadCount > 0 && (
          <span className="self-start px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            tab === "inbox" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-white/50 border border-white/10"
          }`}
        >
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab("broadcast")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            tab === "broadcast" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-white/50 border border-white/10"
          }`}
        >
          Broadcast
        </button>
      </div>

      {tab === "inbox" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["all", "unread", "read"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    status === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium border border-white/10"
            >
              Mark all as read
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-white/50">Loading notifications...</div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center text-white/50">
              No notifications in this filter.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`relative p-5 rounded-xl border ${
                      notif.is_read
                        ? "bg-white/5 border-white/5"
                        : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20"
                    }`}
                  >
                    {!notif.is_read && (
                      <div className="absolute top-5 left-3 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className={`font-semibold ${notif.is_read ? "text-white/80" : "text-white"}`}>{notif.title}</h3>
                        <span className="text-xs text-white/40 whitespace-nowrap">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${notif.is_read ? "text-white/50" : "text-white/70"}`}>{notif.message}</p>
                      <div className="flex gap-4 mt-4">
                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === notif.id}
                          onClick={() => deleteNotification(notif.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === notif.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleBroadcast} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/80 mb-2">Notification Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Flash Sale Alert!"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="sm:w-1/3">
                <label className="block text-sm font-medium text-white/80 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-white"
                >
                  <option value="INFO">Info</option>
                  <option value="PROMO">Promo</option>
                  <option value="WARNING">Warning</option>
                  <option value="SUCCESS">Success</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Message Body</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your notification message here..."
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <label className="flex items-center gap-4 cursor-pointer group mb-4">
                <div className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_global ? "bg-blue-500" : "bg-white/10"}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                  />
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_global ? "translate-x-7" : "translate-x-1"}`} />
                </div>
                <span className="font-medium text-white/80 group-hover:text-white transition-colors">Broadcast to all users</span>
              </label>

              {!formData.is_global && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">Target User ID</label>
                  <input
                    type="text"
                    value={formData.target_user_id}
                    onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
                    placeholder="e.g. usr_12345abc"
                    required={!formData.is_global}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50"
                  />
                </motion.div>
              )}
            </div>

            {sendMsg && (
              <div
                className={`p-4 rounded-xl text-center text-sm font-medium ${
                  sendMsg.includes("success")
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {sendMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {sending ? "Sending..." : formData.is_global ? "Send Broadcast Message" : "Send Direct Message"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
