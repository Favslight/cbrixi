import { io, Socket } from "socket.io-client";
import { API_URL } from "./api";

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: "USER" | "ADMIN";
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
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
