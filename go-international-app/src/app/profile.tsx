import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingView } from '@/components/state-views';
import { Brand } from '@/constants/theme';
import { api, ApiError, authHeaders, BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import type { CurrentUser } from '@/lib/types';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssue, setPassportIssue] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [photoHeaders, setPhotoHeaders] = useState<Record<string, string>>({});
  const [photoVersion, setPhotoVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<{ user: CurrentUser }>('/api/auth/profile');
      setProfile(data.user);
      setName(data.user.name);
      setEmail(data.user.email ?? '');
      setPassportNumber(data.user.passportNumber ?? '');
      setPassportIssue(data.user.passportIssue ?? '');
      setPassportExpiry(data.user.passportExpiry ?? '');
    } catch {
      // handled by loading state below
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    authHeaders().then(setPhotoHeaders);
    void (async () => {
      await load();
    })();
  }, []);

  function notify(text: string, kind: 'ok' | 'err' = 'ok') {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 3500);
  }

  async function save() {
    setSaving(true);
    try {
      const data = await api.put<{ user: CurrentUser }>('/api/auth/profile', {
        name,
        email,
        passportNumber,
        passportIssue,
        passportExpiry,
      });
      setProfile(data.user);
      notify(t('প্রোফাইল আপডেট হয়েছে', 'Profile updated'));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : t('আপডেট করা যায়নি', 'Could not update'), 'err');
    } finally {
      setSaving(false);
    }
  }

  async function pickAndUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify(t('গ্যালারি অনুমতি প্রয়োজন', 'Gallery permission is required'), 'err');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('photo', {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      const data = await api.postForm<{ profilePhotoKey: string }>('/api/auth/profile-photo', form);
      setProfile((p) => (p ? { ...p, profilePhotoKey: data.profilePhotoKey } : p));
      setPhotoVersion((v) => v + 1);
      await refreshUser();
      notify(t('ছবি আপডেট হয়েছে', 'Photo updated'));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : t('ছবি আপলোড করা যায়নি', 'Could not upload photo'), 'err');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (loading) return <LoadingView />;
  if (!profile) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
      {message && (
        <Text style={[styles.message, message.kind === 'err' ? styles.messageErr : styles.messageOk]}>{message.text}</Text>
      )}

      <View style={styles.photoSection}>
        <View style={styles.avatar}>
          {profile.profilePhotoKey ? (
            <Image
              key={photoVersion}
              source={{ uri: `${BASE_URL}/api/auth/profile-photo?v=${photoVersion}`, headers: photoHeaders }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={{ fontSize: 32 }}>👤</Text>
          )}
        </View>
        <Pressable onPress={pickAndUploadPhoto} disabled={uploadingPhoto}>
          <Text style={styles.changePhotoText}>
            {uploadingPhoto ? '...' : t('ছবি পরিবর্তন করুন', 'Change Photo')}
          </Text>
        </Pressable>
      </View>

      <Field label={t('নাম', 'Name')}>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
      </Field>

      <Field label={t('মোবাইল নম্বর', 'Mobile Number')}>
        <TextInput style={[styles.input, styles.inputDisabled]} value={profile.phone} editable={false} />
      </Field>

      <Field label="Gmail">
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </Field>

      <Field label={t('পাসপোর্ট নম্বর', 'Passport Number')}>
        <TextInput style={styles.input} value={passportNumber} onChangeText={setPassportNumber} />
      </Field>

      <Field label={t('পাসপোর্ট ইস্যু', 'Passport Issue')}>
        <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={Brand.textMuted} value={passportIssue} onChangeText={setPassportIssue} />
      </Field>

      <Field label={t('পাসপোর্ট মেয়াদ শেষ', 'Passport Expiry')}>
        <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={Brand.textMuted} value={passportExpiry} onChangeText={setPassportExpiry} />
      </Field>

      <Pressable style={styles.primaryButton} disabled={saving} onPress={save}>
        <Text style={styles.primaryButtonText}>{saving ? '...' : t('সংরক্ষণ করুন', 'Save Changes')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 20, paddingBottom: 60 },
  message: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginBottom: 12, padding: 10, borderRadius: 10 },
  messageOk: { color: '#166534', backgroundColor: '#DCFCE7' },
  messageErr: { color: '#991B1B', backgroundColor: '#FEE2E2' },
  photoSection: { alignItems: 'center', gap: 8, marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  changePhotoText: { color: Brand.blue, fontWeight: '700', fontSize: 13 },
  label: { fontSize: 12, fontWeight: '700', color: Brand.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Brand.text, backgroundColor: Brand.white },
  inputDisabled: { backgroundColor: '#F3F4F6', color: Brand.textMuted },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 14 },
});
