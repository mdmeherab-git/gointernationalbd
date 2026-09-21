import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import type { ApiCircular } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

export default function JobsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { data, loading, refreshing, error, refresh, reload } = useApiQuery(() =>
    api.get<{ circulars: ApiCircular[] }>('/api/circulars'),
  );

  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Set((data?.circulars ?? []).map((c) => c.country));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    let list = data?.circulars ?? [];
    if (country) list = list.filter((c) => c.country === country);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, country, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>💼 {t('চাকরির সার্কুলার', 'Job Circulars')}</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('চাকরি খুঁজুন...', 'Search jobs...')}
          style={styles.searchInput}
        />
      </View>

      {countries.length > 0 && (
        <View style={styles.filterRow}>
          <Pressable onPress={() => setCountry(null)} style={[styles.filterChip, !country && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, !country && styles.filterChipTextActive]}>{t('সব', 'All')}</Text>
          </Pressable>
          {countries.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCountry(c)}
              style={[styles.filterChip, country === c && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, country === c && styles.filterChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyView icon="💼" text={t('কোনো চাকরি পাওয়া যায়নি।', 'No jobs found.')} />
      )}
      {!loading && !error && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.blue} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } })}>
              <View style={styles.cardTopRow}>
                <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardCountry}>{item.country}</Text>
                  <Text style={styles.cardTitle}>{item.category || item.title}</Text>
                </View>
                <StatusPill active={item.status === 'active'} />
              </View>
              <View style={styles.cardGrid}>
                <CardStat label={t('বেতন', 'Salary')} value={item.salary} />
                <CardStat label={t('পদসংখ্যা', 'Vacancy')} value={String(item.vacancy)} />
                <CardStat label={t('শেষ তারিখ', 'Deadline')} value={item.deadline || '—'} />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const { t } = useLanguage();
  return (
    <View style={[styles.pill, { backgroundColor: active ? '#DCFCE7' : '#F3F4F6' }]}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: active ? Brand.success : Brand.textMuted }}>
        {active ? t('সক্রিয়', 'Active') : t('নিষ্ক্রিয়', 'Inactive')}
      </Text>
    </View>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  headerBar: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  searchRow: { paddingHorizontal: Spacing.three, marginBottom: 8 },
  searchInput: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.three, marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.white },
  filterChipActive: { backgroundColor: Brand.blue, borderColor: Brand.blue },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Brand.text },
  filterChipTextActive: { color: Brand.white },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: Brand.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Brand.border, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCountry: { fontSize: 11, color: Brand.textMuted, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Brand.primary },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  cardGrid: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: 10 },
  statLabel: { fontSize: 10, color: Brand.textMuted },
  statValue: { fontSize: 12, color: Brand.text, fontWeight: '700', marginTop: 2 },
});
