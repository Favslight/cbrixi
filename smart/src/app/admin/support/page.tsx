"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { API_URL, getAdminToken } from "@/lib/api";
import {
  createSupportSocket,
  getMessageSenderName,
  getSupportCustomerName,
  mergeConversationUpdate,
  sendAdminSupportMessage,
  type ConversationUpdate,
  type SupportConversation,
  type SupportMessage,
} from "@/lib/support";

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

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
        if (data.conversation) {
          setSelectedConversation(data.conversation);
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, ...data.conversation } : c))
          );
        }
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

    const socket = createSupportSocket(token, "admin");

    socket.on("support:conversation:updated", (update: ConversationUpdate) => {
      setConversations((prev) => mergeConversationUpdate(prev, update));

      if (selectedIdRef.current === update.conversation_id) {
        setSelectedConversation((prev) =>
          prev
            ? {
                ...prev,
                firstname: update.firstname ?? prev.firstname,
                lastname: update.lastname ?? prev.lastname,
                username: update.username ?? prev.username,
                email: update.email ?? prev.email,
                full_name: update.full_name ?? prev.full_name,
                name: update.name ?? prev.name,
                display_name: update.display_name ?? prev.display_name,
              }
            : prev
        );
      }
    });

    socket.on("support:message", ({ conversation_id, message }: { conversation_id: string; message: SupportMessage }) => {
      if (conversation_id === selectedIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    socketRef.current = socket;
  }, []);

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
    } else {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelect = (conv: SupportConversation) => {
    setSelectedId(conv.id ?? null);
    setSelectedConversation(conv);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
  };

  const appendMessage = (message: SupportMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !selectedId || sending) return;

    const token = getAdminToken();
    if (!token) return;

    setSending(true);
    setError("");

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit(
        "support:send",
        { conversation_id: selectedId, message: text },
        async (response: { success: boolean; message?: string }) => {
          if (response?.success) {
            setInput("");
            setSending(false);
            return;
          }
          const fallback = await sendAdminSupportMessage(token, selectedId, text);
          setSending(false);
          if (fallback.success && fallback.message) {
            setInput("");
            appendMessage(fallback.message);
          } else {
            setError(response?.message || fallback.error || "Failed to send");
          }
        }
      );
      return;
    }

    const result = await sendAdminSupportMessage(token, selectedId, text);
    setSending(false);
    if (result.success && result.message) {
      setInput("");
      appendMessage(result.message);
    } else {
      setError(result.error || "Failed to send");
    }
  };

  const headerConversation =
    selectedConversation ?? conversations.find((c) => c.id === selectedId) ?? null;
  const customerName = headerConversation ? getSupportCustomerName(headerConversation) : "Customer";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Support Inbox</h1>
        <p className="text-white/50 text-sm">Real-time customer support conversations</p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
        <div className="w-full sm:w-80 border-r border-white/10 flex flex-col min-h-0">
          <div className="p-3 border-b border-white/10 text-sm font-semibold text-white/60">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-white/40 text-sm animate-pulse">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-white/40 text-sm text-center">No conversations yet</div>
            ) : (
              conversations.map((conv) => {
                const customerName = getSupportCustomerName(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelect(conv)}
                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      selectedId === conv.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-medium text-sm truncate">{customerName}</strong>
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="shrink-0 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.email && (
                      <small className="block text-xs text-white/40 truncate mt-0.5">{conv.email}</small>
                    )}
                    {conv.last_message && (
                      <p className="text-xs text-white/40 truncate mt-1">{conv.last_message}</p>
                    )}
                    {conv.last_message_at && (
                      <p className="text-[10px] text-white/30 mt-1">
                        {new Date(conv.last_message_at).toLocaleString()}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="hidden sm:flex flex-1 flex-col min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
              Select a conversation to reply
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10">
                <h2 className="font-semibold">{customerName}</h2>
                {headerConversation?.email && (
                  <p className="text-xs text-white/40 mt-0.5">{headerConversation.email}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-white/40 text-sm text-center py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-white/40 text-sm text-center py-8">No messages yet</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender_type === "ADMIN" ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-white/40 mb-1 px-1">
                        {getMessageSenderName(msg)}
                      </span>
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
