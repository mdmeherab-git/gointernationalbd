import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/language';

export default function AppTabs() {
  const { t } = useLanguage();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>{t('হোম', 'Home')}</TabButton>
          </TabTrigger>
          <TabTrigger name="jobs" href="/jobs" asChild>
            <TabButton>{t('চাকরি', 'Jobs')}</TabButton>
          </TabTrigger>
          <TabTrigger name="applications" href="/applications" asChild>
            <TabButton>{t('আবেদন', 'Applications')}</TabButton>
          </TabTrigger>
          <TabTrigger name="visa" href="/visa" asChild>
            <TabButton>{t('ভিসা', 'Visa')}</TabButton>
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton>{t('অ্যাকাউন্ট', 'Account')}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButtonView, pressed && styles.pressed]}>
      <ThemedText type="small" style={{ color: isFocused ? Brand.primary : Brand.textMuted, fontWeight: isFocused ? '700' : '500' }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          GO International BD
        </ThemedText>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
    color: Brand.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});
