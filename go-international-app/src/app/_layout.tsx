import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Brand } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LanguageProvider, useLanguage } from '@/lib/language';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Brand.primary },
        headerTintColor: Brand.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Brand.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: t('লগইন', 'Login') }} />
      <Stack.Screen name="register" options={{ title: t('অ্যাকাউন্ট তৈরি করুন', 'Create Account') }} />
      <Stack.Screen name="jobs/[id]" options={{ title: t('চাকরির বিবরণ', 'Job Details') }} />
      <Stack.Screen name="notice/[id]" options={{ title: t('নোটিশ', 'Notice') }} />
      <Stack.Screen name="chat" options={{ title: t('অফিস চ্যাট', 'Office Chat') }} />
      <Stack.Screen name="profile" options={{ title: t('আমার প্রোফাইল', 'My Profile') }} />
      <Stack.Screen name="cv" options={{ title: t('আমার CV', 'My CV') }} />
      <Stack.Screen name="documents" options={{ title: t('আমার ডকুমেন্টস', 'My Documents') }} />
      <Stack.Screen name="notifications" options={{ title: t('নোটিফিকেশন', 'Notifications') }} />
      <Stack.Screen name="settings" options={{ title: t('অ্যাকাউন্ট সেটিংস', 'Account Settings') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
}
