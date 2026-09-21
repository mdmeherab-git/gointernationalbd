import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';

import { LoadingView } from '@/components/state-views';
import { Brand } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useLanguage } from '@/lib/language';

/** Mirrors the website's CvData shape (types/cv.ts) just enough to round-trip
 *  safely — the mobile form only edits personal/passport fields (Phase 17:
 *  "Mobile-এ form UI সহজ করবে"), but preserves whatever else already exists
 *  (work experience, education, skills, ...) so editing on mobile never
 *  wipes out a CV built on the website. */
type CvData = Record<string, unknown> & {
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  presentAddress?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportIssue?: string;
  passportExpiry?: string;
  aboutMe?: string;
};

export default function CvScreen() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [data, setData] = useState<CvData>({});
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: CvData | null; updatedAt: string | null }>('/api/account/cv');
      setData(res.data ?? {});
      setUpdatedAt(res.updatedAt);
    } catch {
      // Empty CV state below handles this.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  function set<K extends keyof CvData>(key: K, value: CvData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.put('/api/account/cv', { data });
      setMessage({ text: t('CV সংরক্ষণ হয়েছে', 'CV saved'), kind: 'ok' });
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : t('সংরক্ষণ করা যায়নি', 'Could not save'), kind: 'err' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  }

  function downloadFromWebsite() {
    Alert.alert(
      t('PDF ডাউনলোড', 'PDF Download'),
      t(
        'সম্পূর্ণ ডিজাইন করা PDF ডাউনলোড করতে ওয়েবসাইটের CV Builder ব্যবহার করুন — আপনার এখানের সংরক্ষিত তথ্য সেখানেও দেখা যাবে।',
        'To download the fully designed PDF, use the CV Builder on the website — your data saved here will show up there too.',
      ),
    );
  }

  if (loading) return <LoadingView />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {message && (
        <Text style={[styles.message, message.kind === 'err' ? styles.messageErr : styles.messageOk]}>{message.text}</Text>
      )}

      {updatedAt && (
        <Text style={styles.updatedText}>
          {t('সর্বশেষ আপডেট', 'Last updated')}: {updatedAt.slice(0, 19).replace('T', ' ')}
        </Text>
      )}

      <Field label={t('পূর্ণ নাম', 'Full Name')}>
        <TextInput style={styles.input} value={data.fullName ?? ''} onChangeText={(v) => set('fullName', v)} />
      </Field>
      <Field label={t('পেশা / পদবী', 'Job Title')}>
        <TextInput style={styles.input} value={data.jobTitle ?? ''} onChangeText={(v) => set('jobTitle', v)} />
      </Field>
      <Field label={t('ইমেইল', 'Email')}>
        <TextInput style={styles.input} value={data.email ?? ''} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
      </Field>
      <Field label={t('ফোন নম্বর', 'Phone Number')}>
        <TextInput style={styles.input} value={data.phone ?? ''} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
      </Field>
      <Field label={t('বর্তমান ঠিকানা', 'Present Address')}>
        <TextInput style={styles.input} value={data.presentAddress ?? ''} onChangeText={(v) => set('presentAddress', v)} />
      </Field>
      <Field label={t('জন্মতারিখ', 'Date of Birth')}>
        <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={data.dateOfBirth ?? ''} onChangeText={(v) => set('dateOfBirth', v)} />
      </Field>
      <Field label={t('পাসপোর্ট নম্বর', 'Passport Number')}>
        <TextInput style={styles.input} value={data.passportNumber ?? ''} onChangeText={(v) => set('passportNumber', v.toUpperCase())} />
      </Field>
      <Field label={t('পাসপোর্ট ইস্যু', 'Passport Issue')}>
        <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={data.passportIssue ?? ''} onChangeText={(v) => set('passportIssue', v)} />
      </Field>
      <Field label={t('পাসপোর্ট মেয়াদ শেষ', 'Passport Expiry')}>
        <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={data.passportExpiry ?? ''} onChangeText={(v) => set('passportExpiry', v)} />
      </Field>
      <Field label={t('নিজের সম্পর্কে', 'About Me')}>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          multiline
          value={data.aboutMe ?? ''}
          onChangeText={(v) => set('aboutMe', v)}
        />
      </Field>

      <Text style={styles.hint}>
        {t(
          'শিক্ষা, অভিজ্ঞতা, দক্ষতা ও রেফারেন্স সহ সম্পূর্ণ CV তৈরি করতে ওয়েবসাইটের CV Builder ব্যবহার করুন।',
          'Use the website\'s CV Builder for education, experience, skills, and references.',
        )}
      </Text>

      <Pressable style={styles.primaryButton} disabled={saving} onPress={save}>
        <Text style={styles.primaryButtonText}>{saving ? '...' : t('সংরক্ষণ করুন', 'Save')}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={downloadFromWebsite}>
        <Text style={styles.secondaryButtonText}>📄 {t('PDF ডাউনলোড সম্পর্কে', 'About PDF download')}</Text>
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
  updatedText: { fontSize: 11, color: Brand.textMuted, marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: Brand.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, backgroundColor: Brand.white },
  hint: { fontSize: 11, color: Brand.textMuted, marginBottom: 16, lineHeight: 16 },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 14 },
  secondaryButton: { borderWidth: 1, borderColor: Brand.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: Brand.text, fontWeight: '700', fontSize: 13 },
});
