import { apiRequest } from './api';

export type NotificationStatusFilter = 'all' | 'read' | 'unread';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

type NotificationsListResponse = {
  notifications?: AppNotification[];
  message?: string;
};

type UnreadCountResponse = {
  count?: number;
  unread_count?: number;
};

export async function fetchNotifications(
  token: string,
  status: NotificationStatusFilter = 'all',
): Promise<AppNotification[]> {
  const data = await apiRequest<NotificationsListResponse>(`/notifications?status=${status}`, {
    token,
  });
  return data.notifications ?? [];
}

export async function fetchUnreadNotificationCount(token: string): Promise<number> {
  const data = await apiRequest<UnreadCountResponse>('/notifications/unread-count', { token });
  return Number(data.count ?? data.unread_count ?? 0);
}

export async function markNotificationAsRead(token: string, id: string): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
    token,
  });
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  await apiRequest('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}

export async function deleteNotification(token: string, id: string): Promise<void> {
  await apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
    token,
  });
}
