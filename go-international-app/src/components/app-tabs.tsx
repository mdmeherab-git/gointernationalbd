import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/lib/language';

/**
 * expo-router/ui's Tabs (a JS-rendered layout, not the OS-native
 * BottomNavigationView `expo-router/unstable-native-tabs` used before) —
 * switched to this specifically because the native tab bar has no styling
 * surface for a pill-shaped active state, shadow, or elevation; it only
 * exposes backgroundColor/indicatorColor/labelStyle. Same 5 routes, same
 * file-based binding, same navigation behavior — visual design only.
 */
export default function AppTabs() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot />
      <TabList asChild>
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton label={t('হোম', 'Home')} icon={require('@/assets/images/tabIcons/home.png')} />
          </TabTrigger>
          <TabTrigger name="jobs" href="/jobs" asChild>
            <TabButton label={t('চাকরি', 'Jobs')} icon={require('@/assets/images/tabIcons/jobs.png')} />
          </TabTrigger>
          <TabTrigger name="applications" href="/applications" asChild>
            <TabButton label={t('আবেদন', 'Applications')} icon={require('@/assets/images/tabIcons/applications.png')} />
          </TabTrigger>
          <TabTrigger name="visa" href="/visa" asChild>
            <TabButton label={t('ভিসা', 'Visa')} icon={require('@/assets/images/tabIcons/visa.png')} />
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton label={t('অ্যাকাউন্ট', 'Account')} icon={require('@/assets/images/tabIcons/account.png')} />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const PURPLE = '#6D28D9';
const PURPLE_LIGHT = '#F3E8FF';
const INACTIVE = '#8B8398';

function TabButton({
  label,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { label: string; icon: ImageSourcePropType }) {
  return (
    <Pressable {...props} style={styles.tabSlot}>
      <View style={[styles.pill, isFocused && styles.pillActive]}>
        <Image source={icon} style={[styles.icon, { tintColor: isFocused ? PURPLE : INACTIVE }]} resizeMode="contain" />
        {isFocused && (
          <Text style={styles.labelActive} numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
      {!isFocused && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#EEE9F7',
    paddingTop: 8,
    paddingHorizontal: 6,
    shadowColor: PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 44 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: PURPLE_LIGHT,
    shadowColor: PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  icon: { width: 22, height: 22 },
  label: { fontSize: 10.5, fontWeight: '600', color: INACTIVE },
  labelActive: { fontSize: 11.5, fontWeight: '800', color: PURPLE },
});
