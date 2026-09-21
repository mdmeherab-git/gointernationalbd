import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import type { NotificationItem } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

const TYPE_ICON: Record<string, string> = {
  application: '💼',
  visa: '🛂',
  medical: '🩺',
  flight: '✈️',
  general: '🔔',
};

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading, refreshing, error, refresh, reload, setData } = useApiQuery(() =>
    api.get<{ notifications: NotificationItem[]; unreadCount: number }>('/api/account/notifications'),
  );

  async function markRead(item: NotificationItem) {
    if (item.is_read) {
      if (item.link) router.push(item.link as never);
      return;
    }
    setData((prev) =>
      prev
        ? { ...prev, notifications: prev.notifications.map((n) => (n.id === item.id ? { ...n, is_read: 1 } : n)) }
        : prev,
    );
    await api.post('/api/account/notifications/read', { id: item.id });
    if (item.link) router.push(item.link as never);
  }

  async function markAllRead() {
    setData((prev) =>
      prev ? { ...prev, notifications: prev.notifications.map((n) => ({ ...n, is_read: 1 })) } : prev,
    );
    await api.post('/api/account/notifications/read', { all: true });
  }

  const unread = data?.notifications.filter((n) => !n.is_read).length ?? 0;

  return (
    <View style={styles.screen}>
      {unread > 0 && (
        <Pressable style={styles.markAllRow} onPress={markAllRead}>
          <Text style={styles.markAllText}>{t('সব পড়া হয়েছে চিহ্নিত করুন', 'Mark all as read')}</Text>
        </Pressable>
      )}

      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && !error && (data?.notifications.length ?? 0) === 0 && (
        <EmptyView icon="🔔" text={t('কোনো নোটিফিকেশন নেই।', 'No notifications yet.')} />
      )}
      {!loading && !error && (data?.notifications.length ?? 0) > 0 && (
        <FlatList
          data={data!.notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.blue} />}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.is_read && styles.cardUnread]}
              onPress={() => markRead(item)}>
              <Text style={{ fontSize: 18 }}>{TYPE_ICON[item.type] ?? '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.is_read && <View style={styles.dot} />}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.date}>{item.created_at?.slice(0, 19).replace('T', ' ')}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  markAllRow: { padding: Spacing.three, alignItems: 'flex-end' },
  markAllText: { color: Brand.blue, fontWeight: '700', fontSize: 12 },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: 24, gap: 8 },
  card: { flexDirection: 'row', gap: 10, backgroundColor: Brand.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Brand.border },
  cardUnread: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: Brand.primary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.blue },
  message: { fontSize: 12, color: Brand.text, marginTop: 4 },
  date: { fontSize: 10, color: Brand.textMuted, marginTop: 6 },
});
