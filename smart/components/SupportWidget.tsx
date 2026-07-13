"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Socket } from "socket.io-client";
import { API_URL, getUserToken } from "@/lib/api";
import {
  createSupportSocket,
  sendUserSupportMessage,
  type SupportMessage,
} from "@/lib/support";

export default function SupportWidget() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = getUserToken();
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const onAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    setVisible(!!token && !adminToken && !onAdminRoute);
  }, []);

  const loadHistory = useCallback(async () => {
    const token = getUserToken();
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/support/conversation/messages?limit=30&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const msgs: SupportMessage[] = data.messages || [];
        setMessages(msgs);
        if (data.conversation_id) setConversationId(data.conversation_id);
        const last = msgs[msgs.length - 1];
        if (last?.sender_type === "ADMIN" && !openRef.current) setUnread(true);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  const connectSocket = useCallback(() => {
    const token = getUserToken();
    if (!token || socketRef.current?.connected) return;

    const socket = createSupportSocket(token, "user");

    socket.on("support:conversation", ({ conversation_id }: { conversation_id: string }) => {
      setConversationId(conversation_id);
    });

    socket.on("support:message", ({ conversation_id, message }: { conversation_id: string; message: SupportMessage }) => {
      setConversationId(conversation_id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.sender_type === "ADMIN" && !openRef.current) setUnread(true);
    });

    socketRef.current = socket;
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setUnread(false);
    loadHistory();
    connectSocket();
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!visible) return;
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [visible, connectSocket]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const appendMessage = (message: SupportMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
    if (message.conversation_id) setConversationId(message.conversation_id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const token = getUserToken();
    if (!token) return;

    setSending(true);
    setError("");

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit(
        "support:send",
        { conversation_id: conversationId, message: text },
        async (response: { success: boolean; message?: string; data?: SupportMessage }) => {
          if (response?.success) {
            setInput("");
            setSending(false);
            return;
          }
          const fallback = await sendUserSupportMessage(token, text);
          setSending(false);
          if (fallback.success && fallback.message) {
            setInput("");
            appendMessage(fallback.message);
          } else {
            setError(response?.message || fallback.error || "Failed to send message");
          }
        }
      );
      return;
    }

    const result = await sendUserSupportMessage(token, text);
    setSending(false);
    if (result.success && result.message) {
      setInput("");
      appendMessage(result.message);
    } else {
      setError(result.error || "Failed to send message");
    }
  };

  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col rounded-2xl border border-white/10 bg-[#0d0d12]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div>
                <h3 className="font-bold text-sm">Contact Support</h3>
                <p className="text-xs text-white/50">We typically reply within a few hours</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] scrollbar-hide">
              {loading ? (
                <div className="text-center text-white/40 text-sm py-8">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-white/40 text-sm py-8">
                  Start a conversation — we&apos;re here to help!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "USER" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender_type === "USER"
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md"
                          : "bg-white/10 text-white/90 rounded-bl-md"
                      }`}
                    >
                      {msg.message}
                      <div className="text-[10px] opacity-50 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <div className="px-4 py-2 text-xs text-red-400 border-t border-white/5">{error}</div>}

            <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {sending ? "..." : "Send"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          className="fixed bottom-6 left-4 sm:left-6 z-[60] w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          aria-label="Open support chat"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          {unread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#07070a]" />
          )}
        </motion.button>
      )}
    </>
  );
}
