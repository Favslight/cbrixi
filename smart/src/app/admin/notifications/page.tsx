"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

type NotificationParams = {
  title: string;
  message: string;
  type: string;
  target_user_id?: string;
  is_global: boolean;
};

export default function AdminNotificationsPage() {
  const [formData, setFormData] = useState<NotificationParams>({
    title: "",
    message: "",
    type: "INFO",
    target_user_id: "",
    is_global: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/notifications`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Notification sent successfully!");
        setFormData({ title: "", message: "", type: "INFO", target_user_id: "", is_global: true });
      } else {
        setMessage(data.message || "Failed to send notification.");
      }
    } catch {
      setMessage("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Send Notifications</h1>
        <p className="text-white/50 text-sm">Broadcast messages to all users or target specific individuals.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/80 mb-2">Notification Title</label>
              <input 
                required 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Flash Sale Alert!"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50" 
              />
            </div>
            <div className="sm:w-1/3">
              <label className="block text-sm font-medium text-white/80 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
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
              onChange={e => setFormData({...formData, message: e.target.value})}
              placeholder="Type your notification message here..."
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-white/10">
            <label className="flex items-center gap-4 cursor-pointer group mb-4">
              <div className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_global ? 'bg-blue-500' : 'bg-white/10'}`}>
                <input type="checkbox" className="sr-only" checked={formData.is_global} onChange={e => setFormData({...formData, is_global: e.target.checked})} />
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_global ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <span className="font-medium text-white/80 group-hover:text-white transition-colors">Broadcast to all users</span>
            </label>

            {!formData.is_global && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
              >
                <label className="block text-sm font-medium text-white/80 mb-2">Target User ID</label>
                <input 
                  type="text" 
                  value={formData.target_user_id} 
                  onChange={e => setFormData({...formData, target_user_id: e.target.value})}
                  placeholder="e.g. usr_12345abc"
                  required={!formData.is_global}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50" 
                />
                <p className="text-xs text-white/40 mt-2">Only this user will receive the notification.</p>
              </motion.div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-center text-sm font-medium ${message.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {message}
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-lg disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              {loading ? "Sending..." : formData.is_global ? "Send Broadcast Message" : "Send Direct Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
