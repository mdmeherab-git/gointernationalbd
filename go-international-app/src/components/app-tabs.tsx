import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Brand } from '@/constants/theme';
import { useLanguage } from '@/lib/language';

export default function AppTabs() {
  const { t } = useLanguage();

  return (
    <NativeTabs
      backgroundColor={Brand.white}
      indicatorColor={Brand.background}
      labelStyle={{ selected: { color: Brand.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('হোম', 'Home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/home.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="jobs">
        <NativeTabs.Trigger.Label>{t('চাকরি', 'Jobs')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/jobs.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="applications">
        <NativeTabs.Trigger.Label>{t('আবেদন', 'Applications')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/applications.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="visa">
        <NativeTabs.Trigger.Label>{t('ভিসা', 'Visa')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/visa.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>{t('অ্যাকাউন্ট', 'Account')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/account.png')} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
