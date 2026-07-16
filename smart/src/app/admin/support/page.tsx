"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { API_URL, getAdminToken } from "@/lib/api";
import {
  createSupportSocket,
  EMPTY_SUPPORT_PAGINATION,
  getMessageSenderName,
  getSupportCustomerName,
  mergeConversationUpdate,
  normalizeSupportPagination,
  sendAdminSupportMessage,
  sortSupportMessages,
  type ConversationUpdate,
  type SupportConversation,
  type SupportMessage,
  type SupportPagination,
} from "@/lib/support";

const CONVERSATIONS_LIMIT = 50;
const MESSAGES_LIMIT = 50;

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [listPagination, setListPagination] = useState<SupportPagination>(EMPTY_SUPPORT_PAGINATION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesPagination, setMessagesPagination] = useState<SupportPagination>(EMPTY_SUPPORT_PAGINATION);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const fetchConversations = useCallback(async (page = 1) => {
    const token = getAdminToken();
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/support/conversations?page=${page}&limit=${CONVERSATIONS_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations || []);
        setListPagination(normalizeSupportPagination(data.pagination, CONVERSATIONS_LIMIT));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string, page = 1, prepend = false) => {
    const token = getAdminToken();
    if (!token) return;

    if (prepend) setLoadingOlderMessages(true);
    else setLoadingMessages(true);

    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(
        `${API_URL}/admin/support/conversations/${conversationId}/messages?page=${page}&limit=${MESSAGES_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        const nextMessages: SupportMessage[] = data.messages || [];
        setMessagesPagination(normalizeSupportPagination(data.pagination, MESSAGES_LIMIT));

        if (data.conversation) {
          setSelectedConversation(data.conversation);
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, ...data.conversation } : c))
          );
        }

        setMessages((prev) => {
          if (!prepend) return sortSupportMessages(nextMessages);

          const existingIds = new Set(prev.map((m) => m.id));
          const older = nextMessages.filter((m) => !existingIds.has(m.id));
          return sortSupportMessages([...older, ...prev]);
        });

        if (prepend && container) {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          });
        } else {
          shouldStickToBottomRef.current = true;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
      setLoadingOlderMessages(false);
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
                last_message: update.last_message ?? prev.last_message,
                last_message_at: update.last_message_at ?? prev.last_message_at,
              }
            : prev
        );
      }
    });

    socket.on("support:message", ({ conversation_id, message }: { conversation_id: string; message: SupportMessage }) => {
      if (conversation_id === selectedIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return sortSupportMessages([...prev, message]);
        });
        shouldStickToBottomRef.current = true;
      }
    });

    socketRef.current = socket;
  }, []);

  useEffect(() => {
    fetchConversations(1);
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [fetchConversations, connectSocket]);

  useEffect(() => {
    if (selectedId) {
      setMessages([]);
      setMessagesPagination(EMPTY_SUPPORT_PAGINATION);
      fetchMessages(selectedId, 1, false);
      socketRef.current?.emit("support:join", { conversation_id: selectedId });
    } else {
      setSelectedConversation(null);
      setMessages([]);
      setMessagesPagination(EMPTY_SUPPORT_PAGINATION);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSelect = (conv: SupportConversation) => {
    setSelectedId(conv.id ?? null);
    setSelectedConversation(conv);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
  };

  const handleLoadOlderMessages = () => {
    if (!selectedId || !messagesPagination.has_more || loadingOlderMessages) return;
    fetchMessages(selectedId, messagesPagination.page + 1, true);
  };

  const appendMessage = (message: SupportMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return sortSupportMessages([...prev, message]);
    });
    shouldStickToBottomRef.current = true;
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
        <p className="text-white/50 text-sm">
          Only conversations where customers have sent at least one message are listed.
        </p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
        <div className="w-full sm:w-80 border-r border-white/10 flex flex-col min-h-0">
          <div className="p-3 border-b border-white/10 text-sm font-semibold text-white/60">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-4 text-white/40 text-sm animate-pulse">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-white/40 text-sm text-center">No conversations yet</div>
            ) : (
              conversations.map((conv) => {
                const name = getSupportCustomerName(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelect(conv)}
                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      selectedId === conv.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-medium text-sm truncate">{name}</strong>
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

          <div className="p-3 border-t border-white/10 space-y-2">
            <p className="text-[11px] text-white/40 text-center">
              Page {listPagination.page} of {listPagination.total_pages} ({listPagination.total} chats)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!listPagination.has_previous || loadingList}
                onClick={() => fetchConversations(listPagination.page - 1)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!listPagination.has_more || loadingList}
                onClick={() => fetchConversations(listPagination.page + 1)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
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

              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesPagination.has_more && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadOlderMessages}
                      disabled={loadingOlderMessages}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50"
                    >
                      {loadingOlderMessages ? "Loading older..." : "Load older messages"}
                    </button>
                  </div>
                )}

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
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
