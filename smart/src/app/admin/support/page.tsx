"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, getAdminToken } from "@/lib/api";

interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: "USER" | "ADMIN";
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  status?: string;
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/support/conversations?limit=20&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const token = getAdminToken();
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/support/conversations/${conversationId}/messages?limit=30&offset=0`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const connectSocket = useCallback(() => {
    const token = getAdminToken();
    if (!token || socketRef.current?.connected) return;

    const socket = io(API_URL, {
      path: "/socket.io",
      auth: { token, role: "admin" },
      transports: ["websocket", "polling"],
    });

    socket.on(
      "support:conversation:updated",
      (update: {
        conversation_id: string;
        last_message: string;
        last_message_at: string;
        unread_count: number;
      }) => {
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === update.conversation_id);
          if (existing) {
            return prev
              .map((c) =>
                c.id === update.conversation_id
                  ? {
                      ...c,
                      last_message: update.last_message,
                      last_message_at: update.last_message_at,
                      unread_count: update.unread_count,
                    }
                  : c
              )
              .sort((a, b) =>
                new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
              );
          }
          fetchConversations();
          return prev;
        });
      }
    );

    socket.on("support:message", ({ conversation_id, message }: { conversation_id: string; message: SupportMessage }) => {
      if (conversation_id === selectedId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    socketRef.current = socket;
  }, [selectedId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [fetchConversations, connectSocket]);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      socketRef.current?.emit("support:join", { conversation_id: selectedId });
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !selectedId || sending) return;

    const socket = socketRef.current;
    if (!socket?.connected) {
      setError("Socket not connected");
      return;
    }

    setSending(true);
    setError("");
    socket.emit(
      "support:send",
      { conversation_id: selectedId, message: text },
      (response: { success: boolean; message?: string }) => {
        setSending(false);
        if (response?.success) {
          setInput("");
        } else {
          setError(response?.message || "Failed to send");
        }
      }
    );
  };

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Support Inbox</h1>
        <p className="text-white/50 text-sm">Real-time customer support conversations</p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
        {/* Conversation list */}
        <div className="w-full sm:w-80 border-r border-white/10 flex flex-col min-h-0">
          <div className="p-3 border-b border-white/10 text-sm font-semibold text-white/60">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-white/40 text-sm animate-pulse">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-white/40 text-sm text-center">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedId === conv.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {conv.user_name || conv.user_email || `User ${conv.user_id?.slice(0, 8)}`}
                    </span>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="shrink-0 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-white/40 truncate mt-1">{conv.last_message}</p>
                  )}
                  {conv.last_message_at && (
                    <p className="text-[10px] text-white/30 mt-1">
                      {new Date(conv.last_message_at).toLocaleString()}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message panel */}
        <div className="hidden sm:flex flex-1 flex-col min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
              Select a conversation to reply
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10">
                <h2 className="font-semibold">
                  {selected?.user_name || selected?.user_email || "Customer"}
                </h2>
                {selected?.user_email && selected?.user_name && (
                  <p className="text-xs text-white/40">{selected.user_email}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-white/40 text-sm text-center py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-white/40 text-sm text-center py-8">No messages yet</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "ADMIN" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          msg.sender_type === "ADMIN"
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

              {error && <div className="px-4 text-xs text-red-400">{error}</div>}

              <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-blue-500/50"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  Reply
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
