import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CountryFlag } from '@/components/CountryFlag';
import { Brand } from '@/constants/theme';
import { guessCountryCode } from '@/lib/country-match';
import { useLanguage } from '@/lib/language';
import type { ApiCircular } from '@/lib/types';

/**
 * Text-only 2-column job card for the Home page's "সর্বশেষ চাকরির
 * সার্কুলার" section, matching the approved Home-screen reference design
 * exactly (flag + title, country, salary, vacancy, deadline, a circular
 * arrow action — no circular preview image). This is deliberately
 * different from the Jobs tab's own JobGridCard (which keeps its image
 * preview, per the earlier approved Jobs-tab design) since the reference
 * that drove this component is explicitly scoped to the Home screen only.
 * Tapping the card or the arrow both go to the same Job Details screen;
 * Apply itself lives there, same single flow as everywhere else in the app.
 */
export function CompactJobCard({ job, onPress }: { job: ApiCircular; onPress: () => void }) {
  const { t } = useLanguage();
  const code = job.countryCode || guessCountryCode(job.country);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <CountryFlag code={code} width={20} height={15} />
        <Text style={styles.title} numberOfLines={1}>
          {job.category || job.title}
        </Text>
      </View>
      <Text style={styles.country} numberOfLines={1}>
        {job.country}
      </Text>
      <Text style={styles.salary} numberOfLines={1}>
        {t('বেতন: ', 'Salary: ')}
        {job.salary || '—'}
      </Text>
      <Text style={styles.metaLine} numberOfLines={1}>
        👤 {job.vacancy} {t('জন', 'Vacancy')}
      </Text>
      <Text style={styles.metaLine} numberOfLines={1}>
        📅 {t('শেষ তারিখ: ', 'Deadline: ')}
        {job.deadline || '—'}
      </Text>

      <Pressable style={styles.arrowButton} onPress={onPress} hitSlop={6}>
        <Text style={styles.arrowButtonText}>→</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 12,
    paddingBottom: 40,
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 13, fontWeight: '800', color: Brand.text, flexShrink: 1 },
  country: { fontSize: 11, color: Brand.textMuted },
  salary: { fontSize: 12, fontWeight: '700', color: Brand.primary, marginTop: 2 },
  metaLine: { fontSize: 10.5, color: Brand.textMuted, marginTop: 1 },
  arrowButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonText: { color: Brand.white, fontSize: 15, fontWeight: '800' },
});
