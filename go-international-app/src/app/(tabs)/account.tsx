import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';
import { authHeaders, BASE_URL, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';

export default function AccountScreen() {
  const { t } = useLanguage();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [photoHeaders, setPhotoHeaders] = useState<Record<string, string>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    authHeaders().then(setPhotoHeaders);
  }, [user?.id]);

  useEffect(() => {
    void (async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }
      try {
        const d = await api.get<{ unreadCount: number }>('/api/account/notifications');
        setUnreadCount(d.unreadCount);
      } catch {
        // Non-fatal — badge just stays at its last known value.
      }
    })();
  }, [user]);

  function confirmLogout() {
    Alert.alert(t('লগআউট', 'Logout'), t('আপনি কি লগআউট করতে চান?', 'Are you sure you want to log out?'), [
      { text: t('বাতিল', 'Cancel'), style: 'cancel' },
      { text: t('লগআউট', 'Logout'), style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: 16 }}>
        <View style={styles.profileCard}>
          {user ? (
            <>
              <View style={styles.avatar}>
                {user.profilePhotoKey ? (
                  <Image
                    source={{ uri: `${BASE_URL}/api/auth/profile-photo`, headers: photoHeaders }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 30 }}>👤</Text>
                )}
              </View>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
              {!!user.email && <Text style={styles.phone}>{user.email}</Text>}
            </>
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 30 }}>👤</Text>
              </View>
              <Text style={styles.name}>{t('অতিথি ব্যবহারকারী', 'Guest User')}</Text>
              <View style={styles.guestButtons}>
                <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
                  <Text style={styles.primaryButtonText}>{t('Login', 'Login')}</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => router.push('/register')}>
                  <Text style={styles.secondaryButtonText}>{t('Account তৈরি করুন', 'Create Account')}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {user && (
          <View style={styles.menuCard}>
            <MenuItem icon="👤" label={t('আমার প্রোফাইল', 'My Profile')} onPress={() => router.push('/profile')} />
            <MenuItem icon="📄" label={t('আমার CV', 'My CV')} onPress={() => router.push('/cv')} />
            <MenuItem
              icon="💼"
              label={t('আমার আবেদন', 'My Applications')}
              onPress={() => router.push('/applications')}
            />
            <MenuItem icon="🌍" label={t('ভিসা স্ট্যাটাস', 'Visa Status')} onPress={() => router.push('/visa')} />
            <MenuItem icon="📋" label={t('আমার ডকুমেন্টস', 'My Documents')} onPress={() => router.push('/documents')} />
            <MenuItem
              icon="🔔"
              label={t('নোটিফিকেশন', 'Notifications')}
              badge={unreadCount > 0 ? unreadCount : undefined}
              onPress={() => router.push('/notifications')}
            />
            <MenuItem icon="⚙️" label={t('অ্যাকাউন্ট সেটিংস', 'Account Settings')} onPress={() => router.push('/settings')} />
            <MenuItem icon="💬" label={t('অফিস চ্যাট', 'Office Chat')} onPress={() => router.push('/chat')} />
            <MenuItem icon="🚪" label={t('লগআউট', 'Logout')} danger onPress={confirmLogout} last />
          </View>
        )}

        {!user && (
          <View style={styles.menuCard}>
            <MenuItem icon="💬" label={t('অফিস চ্যাট', 'Office Chat')} onPress={() => router.push('/chat')} last />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
  badge,
  last,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: number;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.menuItem, !last && styles.menuItemBorder]} onPress={onPress}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: Brand.red }]}>{label}</Text>
      {badge != null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={{ color: Brand.textMuted }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  profileCard: {
    backgroundColor: Brand.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  avatarImage: { width: '100%', height: '100%' },
  name: { fontSize: 17, fontWeight: '800', color: Brand.primary },
  phone: { fontSize: 12, color: Brand.textMuted },
  guestButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 13 },
  secondaryButton: { borderWidth: 1, borderColor: Brand.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  secondaryButtonText: { color: Brand.blue, fontWeight: '700', fontSize: 13 },
  menuCard: { backgroundColor: Brand.white, borderRadius: 20, borderWidth: 1, borderColor: Brand.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Brand.border },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Brand.text },
  badge: { backgroundColor: Brand.red, borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: Brand.white, fontSize: 11, fontWeight: '700' },
});
