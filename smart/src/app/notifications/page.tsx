"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../../components/Navbar";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }
      const res = await fetch(`${API_URL}/notifications?status=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto pt-28 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10"
          >
            Mark all as read
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/50">
            <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            Loading notifications...
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center text-white/50">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            You have no notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notifications.map(notif => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className={`relative p-5 rounded-xl border ${notif.is_read ? 'bg-white/5 border-white/5' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20'} flex gap-4 transition-colors`}
                >
                  {!notif.is_read && (
                    <div className="absolute top-5 left-3 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                  <div className="flex-1 pl-3">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`font-semibold ${notif.is_read ? 'text-white/80' : 'text-white'}`}>{notif.title}</h3>
                      <span className="text-xs text-white/40 whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${notif.is_read ? 'text-white/50' : 'text-white/70'}`}>
                      {notif.message}
                    </p>
                    <div className="flex gap-4 mt-4">
                      {!notif.is_read && (
                        <button onClick={() => markAsRead(notif.id)} className="text-xs font-medium text-blue-400 hover:text-blue-300">
                          Mark as read
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notif.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
