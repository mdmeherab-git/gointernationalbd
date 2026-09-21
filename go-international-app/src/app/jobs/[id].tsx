import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import type { ApiCircular } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, reload } = useApiQuery(
    () => api.get<{ circulars: ApiCircular[] }>('/api/circulars'),
    [],
  );
  const job = data?.circulars.find((c) => c.id === id) ?? null;

  const [applyOpen, setApplyOpen] = useState(false);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!job) return <EmptyView icon="💼" text={t('চাকরিটি পাওয়া যায়নি।', 'This job could not be found.')} />;

  function handleApplyPress() {
    if (!user) {
      Alert.alert(
        t('Login প্রয়োজন', 'Login required'),
        t('আবেদন করতে হলে প্রথমে Login করুন।', 'Please log in before applying.'),
        [
          { text: t('বাতিল', 'Cancel'), style: 'cancel' },
          { text: t('Login করুন', 'Login'), onPress: () => router.push('/login') },
        ],
      );
      return;
    }
    setApplyOpen(true);
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: Spacing.three, gap: 14 }}>
        {job.featuredImageUrl && job.circularType === 'image' && (
          <Image source={{ uri: job.featuredImageUrl }} style={styles.heroImage} contentFit="cover" />
        )}

        <View style={styles.titleRow}>
          <Text style={{ fontSize: 28 }}>{job.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.country}>{job.country}</Text>
            <Text style={styles.title}>{job.category || job.title}</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <Stat label={t('বেতন', 'Salary')} value={job.salary} />
          <Stat label={t('পদসংখ্যা', 'Vacancy')} value={String(job.vacancy)} />
          <Stat label={t('শেষ তারিখ', 'Deadline')} value={job.deadline || '—'} />
          <Stat label={t('স্পনসর', 'Sponsor')} value={job.sponsor || '—'} />
          <Stat label={t('কর্মঘণ্টা', 'Duty')} value={job.duty || '—'} />
          <Stat label={t('আবাসন', 'Accommodation')} value={job.accommodation || '—'} />
        </View>

        {!!job.description && (
          <Section title={t('বিবরণ', 'Description')}>
            <Text style={styles.bodyText}>{job.description}</Text>
          </Section>
        )}

        {job.requirements.length > 0 && (
          <Section title={t('প্রয়োজনীয়তা', 'Requirements')}>
            {job.requirements.map((r, i) => (
              <Text key={i} style={styles.bulletText}>
                • {r}
              </Text>
            ))}
          </Section>
        )}
      </ScrollView>

      <View style={styles.actionBar}>
        {job.circularUrl && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Linking.openURL(job.circularUrl!)}>
            <Text style={styles.secondaryButtonText}>📄 {t('সার্কুলার দেখুন', 'View Circular')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.primaryButton} onPress={handleApplyPress}>
          <Text style={styles.primaryButtonText}>✅ {t('আবেদন করুন', 'Apply')}</Text>
        </Pressable>
      </View>

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} job={job} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ApplyModal({ open, onClose, job }: { open: boolean; onClose: () => void; job: ApiCircular }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('', t('নাম ও মোবাইল নম্বর দিন।', 'Please enter your name and phone number.'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/applications', {
        applicant_name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
        job_title: job.category || job.title,
        job_country: job.country,
        circular_id: job.id,
      });
      setDone(true);
    } catch (err) {
      Alert.alert('', err instanceof ApiError ? err.message : t('আবেদন করা যায়নি।', 'Could not submit application.'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setDone(false);
    setMessage('');
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {done ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 12 }}>
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text style={styles.sectionTitle}>{t('আবেদন সফল হয়েছে!', 'Application submitted!')}</Text>
              <Pressable style={styles.primaryButton} onPress={handleClose}>
                <Text style={styles.primaryButtonText}>{t('ঠিক আছে', 'OK')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.sectionTitle}>{t('আবেদন করুন', 'Apply for this job')}</Text>
                <Pressable onPress={handleClose}>
                  <Text style={{ fontSize: 20, color: Brand.textMuted }}>✕</Text>
                </Pressable>
              </View>
              <TextInput style={styles.input} placeholder={t('নাম', 'Name')} value={name} onChangeText={setName} />
              <TextInput
                style={styles.input}
                placeholder={t('মোবাইল নম্বর', 'Phone number')}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={styles.input}
                placeholder={t('ইমেইল (ঐচ্ছিক)', 'Email (optional)')}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder={t('বার্তা (ঐচ্ছিক)', 'Message (optional)')}
                multiline
                value={message}
                onChangeText={setMessage}
              />
              <Pressable style={styles.primaryButton} disabled={submitting} onPress={submit}>
                <Text style={styles.primaryButtonText}>{submitting ? '...' : t('জমা দিন', 'Submit')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  heroImage: { width: '100%', height: 180, borderRadius: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  country: { fontSize: 12, color: Brand.textMuted, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: Brand.primary },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { width: '31%', backgroundColor: Brand.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: Brand.border },
  statLabel: { fontSize: 10, color: Brand.textMuted },
  statValue: { fontSize: 12, color: Brand.text, fontWeight: '700', marginTop: 3 },
  section: { backgroundColor: Brand.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Brand.border, gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Brand.primary },
  bodyText: { fontSize: 13, color: Brand.text, lineHeight: 20 },
  bulletText: { fontSize: 13, color: Brand.text, lineHeight: 20 },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.three,
    backgroundColor: Brand.white,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  primaryButton: { flex: 1, backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 13 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: Brand.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: Brand.blue, fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Brand.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
});
