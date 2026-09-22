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

const BANGLA_MONTH_LENGTHS = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29, 30];

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBanglaNumber(n: number): string {
  return n
    .toString()
    .split('')
    .map((d) => BANGLA_DIGITS[Number(d)])
    .join('');
}

/** Same Bangla-calendar approximation the website uses (app/page.tsx) —
 * kept in lockstep so the app and site always show the same date. */
function formatBanglaDate(dhakaDate: Date): string {
  const year = dhakaDate.getFullYear();
  const month = dhakaDate.getMonth();
  const day = dhakaDate.getDate();
  const bengaliNewYear = new Date(year, 3, 14);

  let banglaYear: number;
  let daysFromNewYear: number;
  if (dhakaDate >= bengaliNewYear) {
    banglaYear = year - 593;
    daysFromNewYear = Math.floor((dhakaDate.getTime() - bengaliNewYear.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    const previousNewYear = new Date(year - 1, 3, 14);
    banglaYear = year - 594;
    daysFromNewYear = Math.floor((dhakaDate.getTime() - previousNewYear.getTime()) / (1000 * 60 * 60 * 24));
  }
  void month;
  void day;

  let banglaMonthIndex = 0;
  let banglaDay = daysFromNewYear + 1;
  for (let i = 0; i < BANGLA_MONTH_LENGTHS.length; i++) {
    if (banglaDay <= BANGLA_MONTH_LENGTHS[i]) {
      banglaMonthIndex = i;
      break;
    }
    banglaDay -= BANGLA_MONTH_LENGTHS[i];
  }

  return `${toBanglaNumber(banglaDay)} ${BANGLA_MONTHS[banglaMonthIndex]}, ${toBanglaNumber(banglaYear)}`;
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
        <View style={styles.brandRow}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              <Text style={styles.brandBlue}>GO INTERNATIONAL</Text> <Text style={styles.brandRed}>BD</Text>
            </Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {t('অফিসিয়াল ভিসা চেক ও ইমিগ্রেশন সহায়তা', 'Official Visa Check & Immigration Assistant')}
            </Text>
          </View>
        </View>

        <View style={styles.rightRow}>
          <Pressable
            style={styles.langButton}
            onPress={() => setLanguage(isBangla ? 'en' : 'bn')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('ভাষা পরিবর্তন করুন', 'Switch language')}
          >
            <Text style={styles.langButtonText}>{isBangla ? 'English' : 'বাংলা'}</Text>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  logo: { width: 38, height: 38, flexShrink: 0 },
  brandTextWrap: { flex: 1, minWidth: 0 },
  brandTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  brandBlue: { color: '#0B4DBB' },
  brandRed: { color: '#EF4444' },
  brandSubtitle: { fontSize: 9, color: Brand.textMuted, marginTop: 1 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  langButton: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  langButtonText: { fontSize: 11, fontWeight: '700', color: Brand.text },
});
