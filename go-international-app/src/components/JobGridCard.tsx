import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CountryFlag } from '@/components/CountryFlag';
import { Brand } from '@/constants/theme';
import { resolveAssetUrl } from '@/lib/api';
import { guessCountryCode } from '@/lib/country-match';
import { useLanguage } from '@/lib/language';
import type { ApiCircular } from '@/lib/types';

/**
 * Compact ecommerce-style job card, shared by the Home page's "সর্বশেষ
 * চাকরির সার্কুলার" grid and the Jobs tab's own 2-column grid — dense
 * enough that two fit side by side on a 320–430dp phone. Fills whatever
 * width its parent gives it (`width: '100%'` on the card itself); the
 * caller controls the actual column width (a `flex: 1` FlatList cell, a
 * `width: '48%'` flex-wrap cell, etc). Same data mapping and destination
 * in both places (real flag, resolveAssetUrl'd circular image, salary/
 * vacancy/deadline/status, same Job Details screen) so there is only one
 * details/apply flow in the app.
 */
export function JobGridCard({ job, onPress, onApply }: { job: ApiCircular; onPress: () => void; onApply: () => void }) {
  const { t } = useLanguage();
  const code = job.countryCode || guessCountryCode(job.country);
  const imageUrl = resolveAssetUrl(job.circularUrl);
  const showImage = imageUrl && job.circularType === 'image';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.previewBox}>
        {showImage ? (
          <Image source={{ uri: imageUrl! }} style={styles.previewImage} contentFit="contain" />
        ) : (
          <View style={styles.previewFallback}>
            <Text style={{ fontSize: 24 }}>📄</Text>
          </View>
        )}
        {job.status === 'active' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{t('সচল', 'Active')}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <CountryFlag code={code} width={18} height={13} />
          <Text style={styles.country} numberOfLines={1}>
            {job.country}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {job.category || job.title}
        </Text>
        <Text style={styles.salary} numberOfLines={1}>
          {job.salary || '—'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {t('পদ', 'Vac')} {job.vacancy}
          </Text>
          <Text style={styles.metaDeadline} numberOfLines={1}>
            {job.deadline || '—'}
          </Text>
        </View>

        <Pressable style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyButtonText}>{t('আবেদন করুন', 'Apply')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Brand.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  previewBox: {
    aspectRatio: 4 / 5,
    width: '100%',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  previewFallback: { alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  body: { padding: 8, gap: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  country: { fontSize: 11, fontWeight: '700', color: Brand.text, flexShrink: 1 },
  title: { fontSize: 12, fontWeight: '800', color: Brand.primary, marginTop: 1 },
  salary: { fontSize: 11, color: Brand.blue, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  metaText: { fontSize: 9.5, color: Brand.textMuted },
  metaDeadline: { fontSize: 9.5, color: Brand.red, fontWeight: '700' },
  applyButton: {
    marginTop: 6,
    backgroundColor: Brand.blue,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  applyButtonText: { color: Brand.white, fontSize: 11, fontWeight: '800' },
});
