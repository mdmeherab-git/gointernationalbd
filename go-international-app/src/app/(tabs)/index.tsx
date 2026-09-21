import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/use-api';
import type { ApiCircular, PopularCountry, PublicNotice } from '@/lib/types';
import { LoadingView } from '@/components/state-views';

const VISA_TYPES = [
  { value: 'work', bn: 'ওয়ার্ক ভিসা', en: 'Work Visa' },
  { value: 'tourist', bn: 'ট্যুরিস্ট ভিসা', en: 'Tourist Visa' },
  { value: 'student', bn: 'স্টুডেন্ট ভিসা', en: 'Student Visa' },
  { value: 'business', bn: 'বিজনেস ভিসা', en: 'Business Visa' },
  { value: 'family', bn: 'ফ্যামিলি ভিসা', en: 'Family Visa' },
  { value: 'transit', bn: 'ট্রানজিট ভিসা', en: 'Transit Visa' },
];

const SAUDI_LINKS = [
  { icon: '🛂', bn: 'সৌদি ভিসা চেক', en: 'Saudi Visa Check', url: 'https://visa.mofa.gov.sa/VisaPerson/GetApplicantData' },
  { icon: '🏥', bn: 'সৌদি মেডিকেল চেক', en: 'Saudi Medical Check', url: 'https://wafid.com/en/medical-status-search/' },
  { icon: '📋', bn: 'মেডিকেল আপডেট চেক', en: 'Medical Update Check', url: 'https://visa.mofa.gov.sa/VisaPerson/CheckMedicalResult' },
  { icon: '📄', bn: 'সৌদি Enjaz Check', en: 'Saudi Enjaz Check', url: 'https://visa.mofa.gov.sa/Enjaz/GetVisaInformation/Person' },
];

const MALAYSIA_LINKS = [
  { icon: '🛂', bn: 'মালয়েশিয়া ভিসা চেক', en: 'Malaysia Visa Check', url: 'https://malaysiavisa.imi.gov.my/evisa/check-evisa' },
  { icon: '🏥', bn: 'RHMC মেডিকেল চেক', en: 'RHMC Medical Check', url: 'https://rhmcdhk.com/malaysia-medical-report/' },
];

export default function HomeScreen() {
  const { t, isBangla } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const countries = useApiQuery(() => api.get<{ countries: PopularCountry[] }>('/api/popular-countries'));
  const notices = useApiQuery(() => api.get<{ notices: PublicNotice[] }>('/api/notices'));
  const latestJobs = useApiQuery(() => api.get<{ circulars: ApiCircular[] }>('/api/circulars?limit=6'));
  const featured = useApiQuery(() => api.get<{ circulars: ApiCircular[] }>('/api/circulars?featured=1&limit=5'));

  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([countries.refresh(), notices.refresh(), latestJobs.refresh(), featured.refresh()]);
    setRefreshing(false);
  }

  const [country, setCountry] = useState<string | null>(null);
  const [visaType, setVisaType] = useState<string | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [saudiOpen, setSaudiOpen] = useState(false);
  const [malaysiaOpen, setMalaysiaOpen] = useState(false);

  function handleCheckVisa() {
    if (!country) {
      Alert.alert('', t('দয়া করে একটি দেশ নির্বাচন করুন।', 'Please select a country.'));
      return;
    }
    if (!visaType) {
      Alert.alert('', t('দয়া করে ভিসার ধরন নির্বাচন করুন।', 'Please select a visa type.'));
      return;
    }
    if (!passportNumber.trim()) {
      Alert.alert('', t('দয়া করে পাসপোর্ট নম্বর লিখুন।', 'Please enter your passport number.'));
      return;
    }
    if (country === 'sa') return setSaudiOpen(true);
    if (country === 'my') return setMalaysiaOpen(true);
    Alert.alert(
      '',
      t(`${country.toUpperCase()} এর Visa Check এখনো সংযুক্ত হয়নি।`, `Visa check for ${country.toUpperCase()} is not connected yet.`),
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.blue} />}>
        {/* HEADER */}
        <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
          <View style={styles.headerBrand}>
            <Image source={require('@/assets/images/icon.png')} style={styles.headerLogo} contentFit="contain" />
            <View>
              <Text style={styles.headerTitle}>GO INTERNATIONAL BD</Text>
              <Text style={styles.headerSubtitle}>
                {t('অফিসিয়াল ভিসা চেক ও ইমিগ্রেশন সহায়তা', 'Official Visa Check & Immigration Assistant')}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.profileButton}
            onPress={() => router.push(user ? '/notifications' : '/login')}>
            <Text style={{ fontSize: 18 }}>{user ? '🔔' : '👤'}</Text>
          </Pressable>
        </Animated.View>

        {/* HERO — VISA CHECK */}
        <Animated.View entering={FadeInUp.duration(320).delay(80)} style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>{t('১০০+ দেশের অফিসিয়াল ভিসা চেক', 'Official visa check for 100+ countries')}</Text>
          <Text style={styles.heroTitle}>{t('অফিসিয়াল ভিসা স্ট্যাটাস চেক করুন', 'Check Your Official Visa Status')}</Text>

          <Text style={styles.fieldLabel}>{t('দেশ নির্বাচন করুন', 'Select Country')}</Text>
          <View style={styles.pickerRow}>
            {(countries.data?.countries ?? []).slice(0, 8).map((c) => (
              <Pressable
                key={c.code}
                onPress={() => setCountry(c.code)}
                style={[styles.chip, country === c.code && styles.chipActive]}>
                <Text style={[styles.chipText, country === c.code && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('ভিসার ধরন', 'Visa Type')}</Text>
          <View style={styles.pickerRow}>
            {VISA_TYPES.map((v) => (
              <Pressable
                key={v.value}
                onPress={() => setVisaType(v.value)}
                style={[styles.chip, visaType === v.value && styles.chipActive]}>
                <Text style={[styles.chipText, visaType === v.value && styles.chipTextActive]}>
                  {t(v.bn, v.en)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('পাসপোর্ট নম্বর', 'Passport Number')}</Text>
          <TextInput
            value={passportNumber}
            onChangeText={setPassportNumber}
            placeholder={t('পাসপোর্ট নম্বর লিখুন', 'Enter passport number')}
            autoCapitalize="characters"
            style={styles.input}
          />

          <Pressable style={styles.primaryButton} onPress={handleCheckVisa}>
            <Text style={styles.primaryButtonText}>🔍 {t('ভিসা চেক করুন এখনই', 'Check Visa Now')}</Text>
          </Pressable>
        </Animated.View>

        {/* POPULAR COUNTRIES */}
        <SectionHeader icon="🌍" title={t('জনপ্রিয় দেশসমূহ', 'Popular Countries')} />
        {countries.loading ? (
          <LoadingView />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {(countries.data?.countries ?? []).map((c) => (
              <View key={c.code} style={styles.countryPill}>
                <Text style={{ fontSize: 22 }}>{flagEmoji(c.code)}</Text>
                <Text style={styles.countryPillText}>{c.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* QUICK SERVICES */}
        <SectionHeader icon="⚡" title={t('দ্রুত সেবা', 'Quick Services')} />
        <View style={styles.servicesGrid}>
          <ServiceCard
            icon="📋"
            title={t('চাকরির সার্কুলার', 'Job Circular')}
            desc={t('সর্বশেষ চাকরির সুযোগ দেখুন।', 'See the latest job opportunities.')}
            onPress={() => router.push('/jobs')}
          />
          <ServiceCard
            icon="🎓"
            title={t('দক্ষতা প্রশিক্ষণ', 'Skill Training')}
            desc={t('প্রযুক্তিগত প্রশিক্ষণে অংশ নিন।', 'Enroll in technical training.')}
            onPress={() => Alert.alert('', t('শীঘ্রই আসছে।', 'Coming soon.'))}
          />
          <ServiceCard
            icon="📊"
            title={t('আবেদন ট্র্যাক করুন', 'Track Application')}
            desc={t('আপনার আবেদনের স্ট্যাটাস দেখুন।', 'See your application status.')}
            onPress={() => router.push('/applications')}
          />
          <ServiceCard
            icon="📄"
            title={t('সিভি তৈরি করুন', 'Build Your CV')}
            desc={t('এক পেজের প্রফেশনাল সিভি — ফ্রি।', 'A free one-page professional CV.')}
            onPress={() => router.push(user ? '/cv' : '/login')}
          />
        </View>

        {/* LATEST JOBS */}
        <SectionHeader
          icon="💼"
          title={t('সর্বশেষ চাকরির সার্কুলার', 'Latest Job Circulars')}
          action={{ label: t('সব দেখুন →', 'View All →'), onPress: () => router.push('/jobs') }}
        />
        {latestJobs.loading ? (
          <LoadingView />
        ) : (
          <View style={{ gap: 10, paddingHorizontal: Spacing.three }}>
            {(latestJobs.data?.circulars ?? []).slice(0, 4).map((job) => (
              <JobRow key={job.id} job={job} onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: job.id } })} />
            ))}
          </View>
        )}

        {/* NOTICE BOARD */}
        <SectionHeader icon="📋" title={t('নোটিশ বোর্ড', 'Notice Board')} />
        {notices.loading ? (
          <LoadingView />
        ) : (
          <View style={{ gap: 8, paddingHorizontal: Spacing.three }}>
            {(notices.data?.notices ?? []).slice(0, 5).map((n) => (
              <Pressable
                key={n.id}
                style={styles.noticeRow}
                onPress={() => n.image_url && router.push({ pathname: '/notice/[id]', params: { id: n.id } })}>
                <View style={styles.noticeDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeText} numberOfLines={2}>
                    {isBangla ? n.title_bn : n.title_en}
                  </Text>
                  <Text style={styles.noticeMeta}>
                    📅 {n.notice_date} {n.image_url ? `· ${t('ছবি দেখুন', 'View image')}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* FEATURED CIRCULARS */}
        {(featured.data?.circulars.length ?? 0) > 0 && (
          <>
            <SectionHeader icon="⭐" title={t('বিশেষ সার্কুলার', 'Featured Circulars')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {(featured.data?.circulars ?? []).map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.featuredCard}
                  onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: c.id } })}>
                  {c.featuredImageUrl ? (
                    <Image source={{ uri: c.featuredImageUrl }} style={styles.featuredImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.featuredImage, styles.featuredImageFallback]}>
                      <Text style={{ fontSize: 28 }}>{c.flag}</Text>
                    </View>
                  )}
                  <Text style={styles.featuredCountry}>{c.country}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* AI ASSISTANT + OFFICE CHAT */}
        <View style={styles.assistantCard}>
          <Text style={{ fontSize: 30 }}>🤖</Text>
          <Text style={styles.assistantTitle}>{t('আপনার AI Visa Assistant', 'Your AI Visa Assistant')}</Text>
          <Text style={styles.assistantDesc}>
            {t(
              'ভিসা, বিদেশে চাকরি, প্রয়োজনীয় কাগজপত্র নিয়ে প্রশ্ন করুন — GO Assistant অথবা আমাদের টিম সাহায্য করবে।',
              'Ask about visas, jobs abroad, or required documents — GO Assistant or our team will help.',
            )}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/chat')}>
            <Text style={styles.primaryButtonText}>💬 {t('অফিসে চ্যাট করুন', 'Chat with Office')}</Text>
          </Pressable>
        </View>

        {/* CONTACT */}
        <SectionHeader icon="📞" title={t('যোগাযোগ', 'Contact')} />
        <View style={styles.contactRow}>
          <Pressable style={styles.contactItem} onPress={() => Linking.openURL('tel:+8801872327575')}>
            <Text style={{ fontSize: 20 }}>📞</Text>
            <Text style={styles.contactText}>+88 01872 32 75 75</Text>
          </Pressable>
          <Pressable style={styles.contactItem} onPress={() => Linking.openURL('mailto:info@gointernationalbd.com')}>
            <Text style={{ fontSize: 20 }}>✉️</Text>
            <Text style={styles.contactText}>info@gointernationalbd.com</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ServiceLinksModal
        open={saudiOpen}
        onClose={() => setSaudiOpen(false)}
        title={t('সৌদি আরব', 'Saudi Arabia')}
        links={SAUDI_LINKS}
      />
      <ServiceLinksModal
        open={malaysiaOpen}
        onClose={() => setMalaysiaOpen(false)}
        title={t('মালয়েশিয়া', 'Malaysia')}
        links={MALAYSIA_LINKS}
      />
    </SafeAreaView>
  );
}

function flagEmoji(code: string): string {
  if (code.length !== 2) return '🏳️';
  const base = 127397;
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => base + c.charCodeAt(0)));
}

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

function ServiceCard({ icon, title, desc, onPress }: { icon: string; title: string; desc: string; onPress: () => void }) {
  return (
    <Pressable style={styles.serviceCard} onPress={onPress}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceDesc} numberOfLines={2}>
        {desc}
      </Text>
    </Pressable>
  );
}

function JobRow({ job, onPress }: { job: ApiCircular; onPress: () => void }) {
  return (
    <Pressable style={styles.jobRow} onPress={onPress}>
      <Text style={{ fontSize: 22 }}>{job.flag}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.jobTitle}>{job.category || job.title}</Text>
        <Text style={styles.jobMeta}>
          {job.country} · {job.salary}
        </Text>
      </View>
      <Text style={styles.jobArrow}>›</Text>
    </Pressable>
  );
}

function ServiceLinksModal({
  open,
  onClose,
  title,
  links,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  links: { icon: string; bn: string; en: string; url: string }[];
}) {
  const { t } = useLanguage();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 20, color: Brand.textMuted }}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSubtitle}>{t('চালিয়ে যেতে একটি সেবা নির্বাচন করুন', 'Select a service to continue')}</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {links.map((link) => (
              <Pressable key={link.url} style={styles.modalLink} onPress={() => Linking.openURL(link.url)}>
                <Text style={{ fontSize: 18 }}>{link.icon}</Text>
                <Text style={styles.modalLinkText}>{t(link.bn, link.en)}</Text>
                <Text style={{ color: Brand.blue }}>→</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={{ color: Brand.textMuted, fontWeight: '600' }}>{t('বন্ধ করুন', 'Close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerLogo: { width: 40, height: 40 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Brand.primary },
  headerSubtitle: { fontSize: 10, color: Brand.textMuted, maxWidth: 220 },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginHorizontal: Spacing.three,
    backgroundColor: Brand.white,
    borderRadius: 20,
    padding: Spacing.three,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroEyebrow: { color: Brand.blue, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: Brand.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  fieldLabel: { color: Brand.text, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
  },
  chipActive: { backgroundColor: Brand.blue, borderColor: Brand.blue },
  chipText: { fontSize: 12, color: Brand.text, fontWeight: '600' },
  chipTextActive: { color: Brand.white },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.text,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: Brand.blue,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Brand.primary },
  sectionAction: { fontSize: 12, fontWeight: '700', color: Brand.blue },
  hScroll: { paddingLeft: Spacing.three },
  countryPill: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
    height: 76,
    marginRight: 10,
    borderRadius: 14,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    gap: 4,
  },
  countryPillText: { fontSize: 11, color: Brand.text, fontWeight: '600', textAlign: 'center' },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.three,
    gap: 10,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: Brand.white,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  serviceTitle: { fontSize: 13, fontWeight: '800', color: Brand.primary },
  serviceDesc: { fontSize: 11, color: Brand.textMuted, lineHeight: 15 },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  jobTitle: { fontSize: 13, fontWeight: '700', color: Brand.text },
  jobMeta: { fontSize: 11, color: Brand.textMuted, marginTop: 2 },
  jobArrow: { fontSize: 20, color: Brand.textMuted },
  noticeRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Brand.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  noticeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.success, marginTop: 6 },
  noticeText: { fontSize: 13, color: Brand.text, fontWeight: '600' },
  noticeMeta: { fontSize: 11, color: Brand.textMuted, marginTop: 4 },
  featuredCard: { width: 160, marginRight: 12 },
  featuredImage: { width: 160, height: 100, borderRadius: 14 },
  featuredImageFallback: { backgroundColor: Brand.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Brand.border },
  featuredCountry: { fontSize: 11, color: Brand.textMuted, marginTop: 6 },
  featuredTitle: { fontSize: 13, fontWeight: '700', color: Brand.text },
  assistantCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.five,
    backgroundColor: Brand.primary,
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 6,
  },
  assistantTitle: { color: Brand.white, fontWeight: '800', fontSize: 15 },
  assistantDesc: { color: '#C7D2E8', fontSize: 12, textAlign: 'center', lineHeight: 17, marginBottom: 6 },
  contactRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.three },
  contactItem: {
    flex: 1,
    backgroundColor: Brand.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  contactText: { fontSize: 11, color: Brand.text, fontWeight: '600', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: Brand.white, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  modalSubtitle: { fontSize: 12, color: Brand.textMuted, marginTop: 4 },
  modalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 12,
  },
  modalLinkText: { flex: 1, fontSize: 13, fontWeight: '600', color: Brand.text },
  modalClose: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
