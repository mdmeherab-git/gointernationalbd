import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LoadingView } from '@/components/state-views';
import { Brand } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import type { AccountSettings } from '@/lib/types';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AccountSettings | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [deactivating, setDeactivating] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  useEffect(() => {
    api
      .get<{ settings: AccountSettings }>('/api/account/settings')
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  async function updateSetting<K extends keyof AccountSettings>(key: K, value: AccountSettings[K]) {
    if (!settings) return;
    const prev = settings;
    setSettings({ ...settings, [key]: value });
    try {
      await api.patch('/api/account/settings', { [key]: value });
    } catch {
      setSettings(prev);
      Alert.alert('', t('সেটিংস সংরক্ষণ করা যায়নি।', 'Could not save the setting.'));
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      Alert.alert('', t('নতুন Password মিলছে না।', 'New passwords do not match.'));
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/api/account/settings/password', { currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('', t('Password পরিবর্তন হয়েছে।', 'Password changed.'));
    } catch (err) {
      Alert.alert('', err instanceof ApiError ? err.message : t('Password পরিবর্তন করা যায়নি।', 'Could not change password.'));
    } finally {
      setChangingPassword(false);
    }
  }

  async function deactivate() {
    setDeactivating(true);
    try {
      await api.post('/api/account/settings/deactivate', { password: deactivatePassword });
      await logout();
      router.replace('/');
    } catch (err) {
      Alert.alert('', err instanceof ApiError ? err.message : t('করা যায়নি।', 'Could not deactivate.'));
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <LoadingView />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* LANGUAGE */}
      <Section title={t('ভাষা', 'Language')}>
        <View style={styles.row}>
          <Pressable
            style={[styles.pillButton, language === 'bn' && styles.pillButtonActive]}
            onPress={() => setLanguage('bn')}>
            <Text style={[styles.pillText, language === 'bn' && styles.pillTextActive]}>বাংলা</Text>
          </Pressable>
          <Pressable
            style={[styles.pillButton, language === 'en' && styles.pillButtonActive]}
            onPress={() => setLanguage('en')}>
            <Text style={[styles.pillText, language === 'en' && styles.pillTextActive]}>English</Text>
          </Pressable>
        </View>
      </Section>

      {/* NOTIFICATION PREFERENCES */}
      {settings && (
        <Section title={t('নোটিফিকেশন সেটিংস', 'Notification Preferences')}>
          <Toggle
            label={t('আবেদন আপডেট', 'Application updates')}
            value={!!settings.notify_application}
            onChange={(v) => updateSetting('notify_application', v ? 1 : 0)}
          />
          <Toggle
            label={t('ভিসা আপডেট', 'Visa updates')}
            value={!!settings.notify_visa}
            onChange={(v) => updateSetting('notify_visa', v ? 1 : 0)}
          />
          <Toggle
            label={t('মেডিকেল আপডেট', 'Medical updates')}
            value={!!settings.notify_medical}
            onChange={(v) => updateSetting('notify_medical', v ? 1 : 0)}
          />
          <Toggle
            label={t('সাধারণ নোটিফিকেশন', 'General notifications')}
            value={!!settings.notify_general}
            onChange={(v) => updateSetting('notify_general', v ? 1 : 0)}
            last
          />
        </Section>
      )}

      {/* SECURITY */}
      <Section title={t('Password পরিবর্তন', 'Change Password')}>
        <TextInput
          style={styles.input}
          placeholder={t('বর্তমান Password', 'Current Password')}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={t('নতুন Password', 'New Password')}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={t('নতুন Password নিশ্চিত করুন', 'Confirm New Password')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Pressable style={styles.primaryButton} disabled={changingPassword} onPress={changePassword}>
          <Text style={styles.primaryButtonText}>{changingPassword ? '...' : t('পরিবর্তন করুন', 'Change Password')}</Text>
        </Pressable>
      </Section>

      {/* PRIVACY / ABOUT / CONTACT */}
      <Section title={t('অন্যান্য', 'More')}>
        <MenuRow icon="🚪" label={t('লগআউট', 'Logout')} onPress={() => logout().then(() => router.replace('/'))} />
        <MenuRow
          icon="📞"
          label={t('যোগাযোগ করুন', 'Contact Us')}
          onPress={() => Linking.openURL('tel:+8801872327575')}
        />
        <MenuRow
          icon="ℹ️"
          label={t('আমাদের সম্পর্কে', 'About')}
          onPress={() => Linking.openURL('https://gointernationalbd.com')}
          last
        />
      </Section>

      {/* DANGER ZONE */}
      <Section title={t('বিপজ্জনক অঞ্চল', 'Danger Zone')} danger>
        {!deactivateOpen ? (
          <Pressable style={styles.dangerButton} onPress={() => setDeactivateOpen(true)}>
            <Text style={styles.dangerButtonText}>{t('Account নিষ্ক্রিয় করুন', 'Deactivate Account')}</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <TextInput
              style={styles.input}
              placeholder={t('নিশ্চিত করতে Password দিন', 'Enter password to confirm')}
              secureTextEntry
              value={deactivatePassword}
              onChangeText={setDeactivatePassword}
            />
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={() => setDeactivateOpen(false)}>
                <Text style={styles.secondaryButtonText}>{t('বাতিল', 'Cancel')}</Text>
              </Pressable>
              <Pressable style={styles.dangerButton} disabled={deactivating || !deactivatePassword} onPress={deactivate}>
                <Text style={styles.dangerButtonText}>{deactivating ? '...' : t('নিশ্চিত করুন', 'Confirm')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <View style={[styles.section, danger && styles.sectionDanger]}>
      <Text style={[styles.sectionTitle, danger && { color: Brand.red }]}>{title}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <Pressable style={[styles.toggleRow, !last && styles.toggleRowBorder]} onPress={() => onChange(!value)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

function MenuRow({ icon, label, onPress, last }: { icon: string; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[styles.menuRow, !last && styles.toggleRowBorder]} onPress={onPress}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={{ color: Brand.textMuted }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 16, gap: 16, paddingBottom: 60 },
  section: { backgroundColor: Brand.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Brand.border, gap: 10 },
  sectionDanger: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Brand.primary, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 10 },
  pillButton: { flex: 1, borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  pillButtonActive: { backgroundColor: Brand.blue, borderColor: Brand.blue },
  pillText: { fontWeight: '700', color: Brand.text },
  pillTextActive: { color: Brand.white },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  primaryButtonText: { color: Brand.white, fontWeight: '700' },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  secondaryButtonText: { color: Brand.text, fontWeight: '700' },
  dangerButton: { flex: 1, backgroundColor: Brand.red, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  dangerButtonText: { color: Brand.white, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: Brand.border },
  toggleLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: Brand.text },
  switchTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#D1D5DB', padding: 2 },
  switchTrackOn: { backgroundColor: Brand.blue },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.white },
  switchThumbOn: { marginLeft: 18 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
