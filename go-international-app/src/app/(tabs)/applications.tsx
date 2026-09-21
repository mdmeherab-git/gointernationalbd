import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import type { Application } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

const STATUS_LABEL: Record<Application['status'], { bn: string; en: string; color: string; bg: string }> = {
  new: { bn: 'নতুন', en: 'Submitted', color: '#1D4ED8', bg: '#DBEAFE' },
  reviewing: { bn: 'পর্যালোচনাধীন', en: 'Under Review', color: '#B45309', bg: '#FEF3C7' },
  shortlisted: { bn: 'শর্টলিস্টেড', en: 'Shortlisted', color: '#6D28D9', bg: '#EDE9FE' },
  rejected: { bn: 'প্রত্যাখ্যাত', en: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
  hired: { bn: 'নিয়োগপ্রাপ্ত', en: 'Approved', color: '#15803D', bg: '#DCFCE7' },
};

export default function ApplicationsScreen() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data, loading, refreshing, error, refresh, reload } = useApiQuery(
    () => api.get<{ applications: Application[] }>('/api/account/applications'),
    [user?.id],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>💼 {t('আমার আবেদন', 'My Applications')}</Text>
      </View>

      {!authLoading && !user && (
        <GuestPrompt
          text={t('আপনার আবেদন দেখতে Login করুন।', 'Log in to see your applications.')}
          onLogin={() => router.push('/login')}
        />
      )}

      {user && loading && <LoadingView />}
      {user && !loading && error && <ErrorView message={error} onRetry={reload} />}
      {user && !loading && !error && (data?.applications.length ?? 0) === 0 && (
        <EmptyView icon="💼" text={t('আপনি এখনো কোনো চাকরিতে আবেদন করেননি।', "You haven't applied to any job yet.")} />
      )}
      {user && !loading && !error && (data?.applications.length ?? 0) > 0 && (
        <FlatList
          data={data!.applications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.blue} />}
          renderItem={({ item }) => {
            const status = STATUS_LABEL[item.status];
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>{item.job_title || '—'}</Text>
                    <Text style={styles.jobCountry}>{item.job_country}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: status.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: status.color }}>{t(status.bn, status.en)}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>ID: {item.id}</Text>
                  <Text style={styles.metaText}>{t('আবেদনের তারিখ', 'Applied')}: {item.created_at?.slice(0, 10)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

export function GuestPrompt({ text, onLogin }: { text: string; onLogin: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.guestBox}>
      <Text style={{ fontSize: 36 }}>🔒</Text>
      <Text style={styles.guestText}>{text}</Text>
      <Pressable style={styles.loginButton} onPress={onLogin}>
        <Text style={styles.loginButtonText}>{t('Login করুন', 'Log In')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  headerBar: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: Brand.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Brand.border, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  jobTitle: { fontSize: 15, fontWeight: '800', color: Brand.primary },
  jobCountry: { fontSize: 12, color: Brand.textMuted, marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: 8 },
  metaText: { fontSize: 10, color: Brand.textMuted },
  guestBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  guestText: { fontSize: 14, color: Brand.textMuted, textAlign: 'center' },
  loginButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  loginButtonText: { color: Brand.white, fontWeight: '700' },
});
