import { io, Socket } from "socket.io-client";
import { API_URL } from "./api";

export type SupportConversation = {
  id?: string;
  user_id?: string;
  firstname?: string | null;
  lastname?: string | null;
  username?: string | null;
  email?: string | null;
  full_name?: string | null;
  name?: string | null;
  display_name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ConversationUpdate = SupportConversation & {
  conversation_id: string;
};

export type SupportPagination = {
  page: number;
  limit: number;
  offset: number;
  total: number;
  total_pages: number;
  has_more: boolean;
  has_previous: boolean;
};

export const EMPTY_SUPPORT_PAGINATION: SupportPagination = {
  page: 1,
  limit: 50,
  offset: 0,
  total: 0,
  total_pages: 1,
  has_more: false,
  has_previous: false,
};

export function normalizeSupportPagination(
  raw?: Partial<SupportPagination> | null,
  fallbackLimit = 50
): SupportPagination {
  const page = Number(raw?.page ?? 1) || 1;
  const limit = Number(raw?.limit ?? fallbackLimit) || fallbackLimit;
  const offset = Number(raw?.offset ?? (page - 1) * limit) || 0;
  const total = Number(raw?.total ?? 0) || 0;
  const total_pages = Number(raw?.total_pages ?? Math.max(1, Math.ceil(total / limit) || 1)) || 1;
  return {
    page,
    limit,
    offset,
    total,
    total_pages,
    has_more: Boolean(raw?.has_more),
    has_previous: Boolean(raw?.has_previous ?? page > 1),
  };
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: "USER" | "ADMIN";
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string | null;
  sender_display_name?: string | null;
  sender_firstname?: string | null;
  sender_lastname?: string | null;
  sender_username?: string | null;
  sender_email?: string | null;
}

export function sortSupportMessages(messages: SupportMessage[]): SupportMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export const getSupportCustomerName = (conversation: SupportConversation) =>
  conversation.display_name ||
  conversation.name ||
  conversation.full_name ||
  [conversation.firstname, conversation.lastname].filter(Boolean).join(" ") ||
  conversation.username ||
  conversation.email ||
  "Customer";

export const getMessageSenderName = (message: SupportMessage) =>
  message.sender_name ||
  message.sender_display_name ||
  (message.sender_type === "ADMIN" ? "CBRIXI Support" : "Customer");

export function mergeConversationUpdate(
  prev: SupportConversation[],
  update: ConversationUpdate
): SupportConversation[] {
  const existing = prev.find((c) => c.id === update.conversation_id);

  if (!existing) {
    return [
      {
        id: update.conversation_id,
        user_id: update.user_id,
        firstname: update.firstname,
        lastname: update.lastname,
        username: update.username,
        email: update.email,
        full_name: update.full_name,
        name: update.name,
        display_name: update.display_name,
        last_message: update.last_message,
        last_message_at: update.last_message_at,
        unread_count: update.unread_count,
        status: update.status,
      },
      ...prev,
    ];
  }

  return prev
    .map((conversation) =>
      conversation.id === update.conversation_id
        ? {
            ...conversation,
            firstname: update.firstname ?? conversation.firstname,
            lastname: update.lastname ?? conversation.lastname,
            username: update.username ?? conversation.username,
            email: update.email ?? conversation.email,
            full_name: update.full_name ?? conversation.full_name,
            name: update.name ?? conversation.name,
            display_name: update.display_name ?? conversation.display_name,
            last_message: update.last_message,
            last_message_at: update.last_message_at,
            unread_count: update.unread_count,
          }
        : conversation
    )
    .sort(
      (a, b) =>
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );
}

export function createSupportSocket(token: string, role: "user" | "admin"): Socket {
  return io(API_URL, {
    path: "/socket.io",
    auth: { token, role },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
  });
}

export async function sendUserSupportMessage(
  token: string,
  message: string
): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
  const res = await fetch(`${API_URL}/support/conversation/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (res.ok && data.success !== false) {
    return { success: true, message: data.message };
  }
  return { success: false, error: data.message || "Failed to send message" };
}

export async function sendAdminSupportMessage(
  token: string,
  conversationId: string,
  message: string
): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
  const res = await fetch(`${API_URL}/admin/support/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (res.ok && data.success !== false) {
    return { success: true, message: data.message };
  }
  return { success: false, error: data.message || "Failed to send message" };
}
