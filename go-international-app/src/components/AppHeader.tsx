import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useLanguage } from '@/lib/language';

const BANGLA_MONTHS = [
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
];

const BANGLA_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function isGregorianLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function toBanglaNumber(n: number): string {
  return n
    .toString()
    .split('')
    .map((d) => BANGLA_DIGITS[Number(d)])
    .join('');
}

/** Bangladesh's official reformed Bangla calendar (Pohela Boishakh fixed
 * to April 14 every year): Boishakh–Bhadro (5 months) = 31 days,
 * Ashwin–Falgun (6 months) = 30 days, Choitro = 30 days, or 31 in a
 * Gregorian leap year — Choitro always falls in the Jan–Apr stretch of
 * the *following* Gregorian year, so the leap check must use that year,
 * not the year Poyla Boishakh started in. Previously Falgun was
 * hardcoded to 29 and Choitro was never adjusted for leap years, which
 * silently drifted the month (and eventually the date) wrong every year. */
function banglaMonthLengths(newYearGregorianYear: number): number[] {
  const choitroYear = newYearGregorianYear + 1;
  return [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, isGregorianLeapYear(choitroYear) ? 31 : 30];
}

function formatBanglaDate(dhakaDate: Date): string {
  const year = dhakaDate.getFullYear();
  const bengaliNewYear = new Date(year, 3, 14);

  let banglaYear: number;
  let daysFromNewYear: number;
  let newYearGregorianYear: number;
  if (dhakaDate >= bengaliNewYear) {
    banglaYear = year - 593;
    newYearGregorianYear = year;
    daysFromNewYear = Math.floor((dhakaDate.getTime() - bengaliNewYear.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    const previousNewYear = new Date(year - 1, 3, 14);
    banglaYear = year - 594;
    newYearGregorianYear = year - 1;
    daysFromNewYear = Math.floor((dhakaDate.getTime() - previousNewYear.getTime()) / (1000 * 60 * 60 * 24));
  }

  const monthLengths = banglaMonthLengths(newYearGregorianYear);
  let banglaMonthIndex = 0;
  let banglaDay = daysFromNewYear + 1;
  for (let i = 0; i < monthLengths.length; i++) {
    if (banglaDay <= monthLengths[i]) {
      banglaMonthIndex = i;
      break;
    }
    banglaDay -= monthLengths[i];
  }

  const weekday = BANGLA_WEEKDAYS[dhakaDate.getDay()];
  return `${weekday}, ${toBanglaNumber(banglaDay)} ${BANGLA_MONTHS[banglaMonthIndex]}, ${toBanglaNumber(banglaYear)}`;
}

function useLiveDhakaClock(): string {
  const [text, setText] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const dhakaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      const time = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setText(`${time} | ${formatBanglaDate(dhakaDate)}`);
    }

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return text;
}

/** Mirrors the website's mobile header exactly (app/page.tsx): a dark navy
 * live clock + Bangla date strip, then logo + brand + language switch. Only
 * mounted on the Home tab, matching how a user first compares the two. */
export function AppHeader({ rightExtra }: { rightExtra?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { t, isBangla, setLanguage } = useLanguage();
  const clockText = useLiveDhakaClock();

  return (
    <View>
      <View style={[styles.timeBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.timeBarText} numberOfLines={1}>
          🕐 {clockText || '--:--:-- | ---'}
        </Text>
      </View>

      <View style={styles.mainHeader}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />

        <View style={styles.brandCenter}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            <Text style={styles.brandBlue}>GO INTERNATIONAL</Text> <Text style={styles.brandRed}>BD</Text>
          </Text>
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            {t('অফিসিয়াল ভিসা চেক ও ইমিগ্রেশন সহায়তা', 'Official Visa Check & Immigration Assistant')}
          </Text>
        </View>

        <View style={styles.rightRow}>
          <Pressable
            style={styles.langButton}
            onPress={() => setLanguage(isBangla ? 'en' : 'bn')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('ভাষা পরিবর্তন করুন', 'Switch language')}
          >
            <Text style={styles.langButtonIcon}>🌐</Text>
            {/* Shows the language to switch TO (Bangla mode -> "English",
                English mode -> "বাংলা"), matching the toggle behavior used
                everywhere else in the app — not the currently-active one. */}
            <Text style={styles.langButtonText}>{isBangla ? 'English' : 'বাংলা'}</Text>
            <Text style={styles.langButtonChevron}>▾</Text>
          </Pressable>
          {rightExtra}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeBar: {
    backgroundColor: '#071B41',
    paddingBottom: 7,
    alignItems: 'center',
  },
  timeBarText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Brand.white,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  logo: { width: 44, height: 44, flexShrink: 0 },
  brandCenter: { flex: 1, minWidth: 0, alignItems: 'center' },
  brandTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2, textAlign: 'center' },
  brandBlue: { color: '#0B4DBB' },
  brandRed: { color: '#EF4444' },
  brandSubtitle: { fontSize: 9, color: Brand.textMuted, marginTop: 1, textAlign: 'center' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  langButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  langButtonIcon: { fontSize: 11 },
  langButtonText: { fontSize: 11, fontWeight: '700', color: Brand.text },
  langButtonChevron: { fontSize: 10, color: Brand.textMuted },
});
