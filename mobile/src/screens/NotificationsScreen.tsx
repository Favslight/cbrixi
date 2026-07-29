import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { ScreenPreloader } from '../components/ScreenPreloader';
import { colors } from '../constants/theme';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
  type NotificationStatusFilter,
} from '../services/notifications';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';
import { toErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const FILTERS: NotificationStatusFilter[] = ['all', 'unread', 'read'];

export function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [status, setStatus] = useState<NotificationStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      const token = await storage.getString(storage.keys.userToken);
      if (!token) {
        navigation.replace('Login');
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');
        const list = await fetchNotifications(token, status);
        setNotifications(list);
      } catch (fetchError) {
        setError(toErrorMessage(fetchError, 'Failed to load notifications'));
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation, status],
  );

  useFocusEffect(
    useCallback(() => {
      loadNotifications().catch(() => undefined);
    }, [loadNotifications]),
  );

  const onMarkAsRead = async (id: string) => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) return;
    try {
      await markNotificationAsRead(token, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // ignore — keep unread state
    }
  };

  const onMarkAllAsRead = async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const onDelete = async (id: string) => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // keep visible until delete succeeds
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && notifications.length === 0) {
    return <ScreenPreloader message="Loading notifications..." />;
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadNotifications(true)}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.topBar}>
                  <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.headerTitle}>Notifications</Text>
                  <Pressable onPress={onMarkAllAsRead} style={styles.markAllButton}>
                    <Text style={styles.markAllText}>Mark all</Text>
                  </Pressable>
                </View>

                <View style={styles.filterRow}>
                  {FILTERS.map((filter) => {
                    const active = status === filter;
                    return (
                      <Pressable
                        key={filter}
                        onPress={() => setStatus(filter)}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                      >
                        <Text style={[styles.filterText, active && styles.filterTextActive]}>
                          {filter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                {!loading && !error && notifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="notifications-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No notifications</Text>
                    <Text style={styles.emptyText}>You have no notifications in this filter.</Text>
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                deleting={deletingId === item.id}
                onMarkRead={() => onMarkAsRead(item.id)}
                onDelete={() => onDelete(item.id)}
              />
            )}
          />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

function NotificationCard({
  notification,
  deleting,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification;
  deleting: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const unread = !notification.is_read;

  return (
    <View style={[styles.card, unread ? styles.cardUnread : styles.cardRead]}>
      {unread ? <View style={styles.unreadDot} /> : null}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, unread ? styles.textStrong : styles.textSoft]} numberOfLines={2}>
            {notification.title}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(notification.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.cardMessage, unread ? styles.textMedium : styles.textMuted]}>
          {notification.message}
        </Text>
        <View style={styles.cardActions}>
          {unread ? (
            <Pressable onPress={onMarkRead}>
              <Text style={styles.markReadAction}>Mark as read</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onDelete} disabled={deleting}>
            <Text style={[styles.deleteAction, deleting && styles.disabled]}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 2,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  markAllText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(37,99,235,0.25)',
    borderColor: 'rgba(59,130,246,0.45)',
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: colors.textPrimary,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.55)',
    gap: 8,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  cardUnread: {
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  cardRead: {
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderColor: 'rgba(148,163,184,0.12)',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  cardDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  textStrong: { color: colors.textPrimary },
  textSoft: { color: 'rgba(248,250,252,0.8)' },
  textMedium: { color: 'rgba(248,250,252,0.75)' },
  textMuted: { color: colors.textMuted },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  markReadAction: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteAction: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
