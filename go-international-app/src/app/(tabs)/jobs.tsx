import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountryFlag } from '@/components/CountryFlag';
import { OptionPickerModal, type PickerOption } from '@/components/OptionPickerModal';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api, resolveAssetUrl } from '@/lib/api';
import { guessCountryCode } from '@/lib/country-match';
import { useLanguage } from '@/lib/language';
import type { ApiCircular } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

/**
 * Same fixed country/category option lists as the website's Jobs page
 * (app/jobs/page.tsx `countries`/`categories`) — these are the site's
 * actual supported filter values, not derived from whatever free-text
 * ended up in individual circular records.
 */
const COUNTRY_OPTIONS: { value: string; bn: string; code?: string }[] = [
  { value: 'All Countries', bn: 'সকল দেশ' },
  { value: 'Saudi Arabia', bn: 'সৌদি আরব', code: 'sa' },
  { value: 'Malaysia', bn: 'মালয়েশিয়া', code: 'my' },
  { value: 'UAE', bn: 'সংযুক্ত আরব আমিরাত', code: 'ae' },
  { value: 'Qatar', bn: 'কাতার', code: 'qa' },
  { value: 'Oman', bn: 'ওমান', code: 'om' },
];

const CATEGORY_OPTIONS: { value: string; bn: string }[] = [
  { value: 'All Categories', bn: 'সকল ক্যাটাগরি' },
  { value: 'Driver', bn: 'ড্রাইভার' },
  { value: 'Factory Worker', bn: 'ফ্যাক্টরি কর্মী' },
  { value: 'Electrician', bn: 'ইলেকট্রিশিয়ান' },
  { value: 'Plumber', bn: 'প্লাম্বার' },
  { value: 'Welder', bn: 'ওয়েল্ডার' },
  { value: 'Cleaner', bn: 'ক্লিনার' },
  { value: 'Construction Worker', bn: 'নির্মাণ কর্মী' },
  { value: 'Technician', bn: 'টেকনিশিয়ান' },
];

/** Below this width the 2nd column has no room to breathe (card content —
 * flag + country + circular preview + stat rows — starts wrapping/clipping),
 * so narrow phones fall back to a single full-width column. */
const TWO_COLUMN_MIN_WIDTH = 700;

export default function JobsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
  const { data, loading, refreshing, error, refresh, reload } = useApiQuery(() =>
    api.get<{ circulars: ApiCircular[] }>('/api/circulars'),
  );

  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('All Countries');
  const [category, setCategory] = useState('All Categories');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = data?.circulars ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      const matchesCountry = country === 'All Countries' || c.country === country;
      const matchesCategory = category === 'All Categories' || c.category === category;
      if (!matchesCountry || !matchesCategory) return false;
      if (!q) return true;
      const haystack = [c.country, c.category, c.title, c.sponsor].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [data, country, category, query]);

  const countryOptions: PickerOption[] = COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: t(c.bn, c.value) }));
  const categoryOptions: PickerOption[] = CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: t(c.bn, c.value) }));
  const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === country);
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        key={numColumns}
        data={loading || error ? [] : filtered}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns === 2 ? styles.gridRow : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.blue} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* PAGE HEADER */}
            <View style={styles.hero}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>🌍 {t('বিদেশে কর্মসংস্থানের সুযোগ', 'Overseas Employment Opportunities')}</Text>
              </View>
              <Text style={styles.heroTitle}>{t('বিদেশে চাকরির সার্কুলার', 'Overseas Job Circulars')}</Text>
              <Text style={styles.heroDesc}>
                {t(
                  'বিভিন্ন দেশের সর্বশেষ বিদেশি চাকরির সুযোগ খুঁজুন এবং আপনার জন্য উপযুক্ত পদে সহজেই আবেদন করুন।',
                  'Find the latest overseas job opportunities from different countries and apply for suitable positions easily.',
                )}
              </Text>
            </View>

            {/* SEARCH + FILTERS */}
            <View style={styles.filterCard}>
              <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('চাকরি, দেশ বা ক্যাটাগরি খুঁজুন...', 'Search job, country or category...')}
                  placeholderTextColor={Brand.textMuted}
                  style={styles.searchInput}
                />
              </View>

              <Pressable style={styles.selectorField} onPress={() => setCountryPickerOpen(true)}>
                <Text style={{ fontSize: 16 }}>🌍</Text>
                <Text style={styles.selectorText}>{t(countryLabel?.bn ?? country, country)}</Text>
                <Text style={styles.selectorChevron}>▾</Text>
              </Pressable>

              <Pressable style={styles.selectorField} onPress={() => setCategoryPickerOpen(true)}>
                <Text style={{ fontSize: 16 }}>💼</Text>
                <Text style={styles.selectorText}>{t(categoryLabel?.bn ?? category, category)}</Text>
                <Text style={styles.selectorChevron}>▾</Text>
              </Pressable>

              {!loading && !error && (
                <Text style={styles.countText}>
                  {t('মোট ', 'Showing ')}
                  <Text style={styles.countNumber}>{filtered.length}</Text>
                  {t('টি চাকরির সার্কুলার', ' job circulars')}
                </Text>
              )}
            </View>

            {!loading && !error && filtered.length > 0 && (
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionEyebrow}>{t('সর্বশেষ সুযোগ', 'Latest Opportunities')}</Text>
                <Text style={styles.sectionTitle}>{t('উপলব্ধ চাকরির সার্কুলার', 'Available Job Circulars')}</Text>
              </View>
            )}

            {loading && <LoadingView />}
            {!loading && error && <ErrorView message={error} onRetry={reload} />}
            {!loading && !error && filtered.length === 0 && (
              <EmptyView icon="💼" text={t('কোনো চাকরি পাওয়া যায়নি।', 'No jobs found.')} />
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={numColumns === 2 ? styles.gridCell : styles.singleCell}>
            <JobCard
              job={item}
              onViewDetails={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } })}
              onApply={() => router.push({ pathname: '/jobs/[id]', params: { id: item.id, autoApply: '1' } })}
            />
          </View>
        )}
      />

      <OptionPickerModal
        open={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={setCountry}
        title={t('দেশ নির্বাচন করুন', 'Select Country')}
        selectedValue={country}
        options={countryOptions}
      />
      <OptionPickerModal
        open={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={setCategory}
        title={t('ক্যাটাগরি নির্বাচন করুন', 'Select Category')}
        selectedValue={category}
        options={categoryOptions}
      />
    </SafeAreaView>
  );
}

function JobCard({
  job,
  onViewDetails,
  onApply,
}: {
  job: ApiCircular;
  onViewDetails: () => void;
  onApply: () => void;
}) {
  const { t } = useLanguage();
  const code = job.countryCode || guessCountryCode(job.country);
  const imageUrl = resolveAssetUrl(job.circularUrl);
  const showImage = imageUrl && job.circularType === 'image';

  return (
    <View style={styles.card}>
      {/* CARD HEADER */}
      <View style={styles.cardHeader}>
        <CountryFlag code={code} width={28} height={21} />
        <Text style={styles.cardCountry} numberOfLines={1}>
          {job.country}
        </Text>
      </View>
      {!!job.sponsor && (
        <Text style={styles.cardSponsor}>
          {t('স্পনসর: ', 'Sponsor: ')}
          <Text style={styles.cardSponsorName}>{job.sponsor}</Text>
        </Text>
      )}

      {/* CIRCULAR PREVIEW */}
      <Pressable style={styles.previewBox} onPress={onViewDetails}>
        {showImage ? (
          <Image source={{ uri: imageUrl! }} style={styles.previewImage} contentFit="contain" />
        ) : (
          <View style={styles.previewFallback}>
            <Text style={{ fontSize: 40 }}>📄</Text>
            <Text style={styles.previewFallbackCountry}>{job.country}</Text>
            <Text style={styles.previewFallbackMeta}>
              {job.category} {t('চাকরির সার্কুলার', 'Job Circular')}
            </Text>
            <View style={styles.previewFallbackPill}>
              <Text style={styles.previewFallbackPillText}>{t('সার্কুলার প্রিভিউ', 'Circular Preview')}</Text>
            </View>
          </View>
        )}
      </Pressable>

      {/* CATEGORY BADGE */}
      {!!job.category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{job.category}</Text>
        </View>
      )}

      {/* STATS */}
      <View style={styles.statRows}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('বেতন', 'Salary')}</Text>
          <Text style={styles.statValue}>{job.salary || '—'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('পদসংখ্যা', 'Vacancy')}</Text>
          <Text style={styles.statValue}>{job.vacancy}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('আবেদনের শেষ তারিখ', 'Deadline')}</Text>
          <Text style={styles.statValueDeadline}>{job.deadline || '—'}</Text>
        </View>
      </View>

      {/* BUTTONS */}
      <View style={styles.cardButtons}>
        <Pressable style={styles.detailsButton} onPress={onViewDetails}>
          <Text style={styles.detailsButtonText}>{t('বিস্তারিত দেখুন', 'View Details')}</Text>
        </Pressable>
        <Pressable style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyButtonText}>{t('আবেদন করুন', 'Apply Now')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  listContent: { paddingBottom: 24 },
  hero: { backgroundColor: '#F8FAFC', padding: Spacing.four, gap: 10, borderBottomWidth: 1, borderBottomColor: Brand.border },
  heroPill: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  heroPillText: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Brand.primary },
  heroDesc: { fontSize: 13, color: Brand.textMuted, lineHeight: 19 },
  filterCard: {
    margin: Spacing.three,
    marginTop: -18,
    backgroundColor: Brand.white,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchWrap: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.text,
  },
  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorText: { flex: 1, fontSize: 13, color: Brand.text, fontWeight: '600' },
  selectorChevron: { color: Brand.textMuted },
  countText: { fontSize: 12, color: Brand.textMuted, borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: 10 },
  countNumber: { color: Brand.primary, fontWeight: '800' },
  sectionHeading: { paddingHorizontal: Spacing.three, marginTop: Spacing.two, marginBottom: Spacing.two },
  sectionEyebrow: { fontSize: 12, fontWeight: '700', color: Brand.blue },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Brand.primary, marginTop: 2 },
  singleCell: { paddingHorizontal: Spacing.three },
  gridRow: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  gridCell: { flex: 1 },
  card: {
    marginBottom: Spacing.three,
    backgroundColor: Brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardCountry: { fontSize: 17, fontWeight: '800', color: Brand.text, flexShrink: 1 },
  cardSponsor: { fontSize: 12, color: Brand.textMuted, marginTop: -6 },
  cardSponsorName: { color: Brand.blue, fontWeight: '700' },
  previewBox: {
    aspectRatio: 4 / 5,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  previewFallback: { alignItems: 'center', gap: 4, padding: 16 },
  previewFallbackCountry: { fontWeight: '800', color: Brand.text, marginTop: 4 },
  previewFallbackMeta: { fontSize: 11, color: Brand.textMuted },
  previewFallbackPill: { marginTop: 6, backgroundColor: Brand.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 },
  previewFallbackPillText: { fontSize: 11, color: Brand.textMuted },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  categoryBadgeText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  statRows: { gap: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: Brand.textMuted },
  statValue: { fontSize: 12, fontWeight: '700', color: Brand.text },
  statValueDeadline: { fontSize: 12, fontWeight: '700', color: Brand.red },
  cardButtons: { flexDirection: 'row', gap: 10 },
  detailsButton: { flex: 1, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  detailsButtonText: { fontSize: 12, fontWeight: '800', color: '#1D4ED8' },
  applyButton: { flex: 1, backgroundColor: Brand.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  applyButtonText: { fontSize: 12, fontWeight: '800', color: Brand.white },
});
