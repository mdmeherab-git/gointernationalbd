import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuestPrompt } from './applications';
import { ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import type { VisaStatus } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

const MEDICAL_LABEL: Record<string, [string, string]> = {
  not_started: ['শুরু হয়নি', 'Not Started'],
  in_progress: ['চলমান', 'In Progress'],
  fit: ['ফিট', 'Fit'],
  unfit: ['আনফিট', 'Unfit'],
  completed: ['সম্পন্ন', 'Completed'],
};
const VISA_LABEL: Record<string, [string, string]> = {
  not_started: ['শুরু হয়নি', 'Not Started'],
  processing: ['প্রসেসিং চলছে', 'Processing'],
  running: ['চলমান', 'Running'],
  issued: ['ইস্যু হয়েছে', 'Issued'],
  rejected: ['প্রত্যাখ্যাত', 'Rejected'],
  completed: ['সম্পন্ন', 'Completed'],
};
const FLIGHT_LABEL: Record<string, [string, string]> = {
  not_scheduled: ['নির্ধারিত হয়নি', 'Not Scheduled'],
  pending: ['পেন্ডিং', 'Pending'],
  confirmed: ['কনফার্ম হয়েছে', 'Confirmed'],
  completed: ['সম্পন্ন', 'Completed'],
  cancelled: ['বাতিল', 'Cancelled'],
};

const STEPS = [
  { bn: 'আবেদন', en: 'Application' },
  { bn: 'মেডিকেল', en: 'Medical' },
  { bn: 'মেডিকেল ফিট', en: 'Medical Fit' },
  { bn: 'ভিসা প্রসেসিং', en: 'Visa Processing' },
  { bn: 'ভিসা ইস্যু', en: 'Visa Issued' },
  { bn: 'ফ্লাইট কনফার্ম', en: 'Flight Confirmed' },
];

function currentStep(s: VisaStatus): number {
  if (s.flight_status === 'completed') return 5;
  if (s.flight_status === 'confirmed' || s.flight_status === 'pending') return 4;
  if (s.visa_status === 'issued' || s.visa_status === 'completed') return 3;
  if (s.visa_status === 'processing' || s.visa_status === 'running') return 2;
  if (s.medical_status === 'fit' || s.medical_status === 'completed') return 2;
  if (s.medical_status === 'in_progress') return 1;
  return 0;
}

export default function VisaScreen() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data, loading, error, reload } = useApiQuery(
    () => api.get<{ status: VisaStatus }>('/api/account/visa-status'),
    [user?.id],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>🌍 {t('ভিসা স্ট্যাটাস', 'Visa Status')}</Text>
      </View>

      {!authLoading && !user && (
        <GuestPrompt
          text={t('আপনার ভিসা স্ট্যাটাস দেখতে Login করুন।', 'Log in to see your visa status.')}
          onLogin={() => router.push('/login')}
        />
      )}

      {user && loading && <LoadingView />}
      {user && !loading && error && <ErrorView message={error} onRetry={reload} />}
      {user && !loading && data && (
        <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: 16 }}>
          <View style={styles.timelineCard}>
            {STEPS.map((step, i) => {
              const step_ = currentStep(data.status);
              const done = i <= step_;
              return (
                <View key={step.en} style={styles.timelineRow}>
                  <View style={styles.timelineIconCol}>
                    <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                      <Text style={{ fontSize: 11, color: done ? Brand.white : Brand.textMuted, fontWeight: '700' }}>
                        {done ? '✓' : i + 1}
                      </Text>
                    </View>
                    {i < STEPS.length - 1 && <View style={[styles.timelineLine, i < step_ && styles.timelineLineDone]} />}
                  </View>
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.timelineLabel, { color: done ? Brand.primary : Brand.textMuted }]}>
                      {t(step.bn, step.en)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.statRow}>
            <StatusCard icon="🩺" label="Medical" value={t(...MEDICAL_LABEL[data.status.medical_status])} />
            <StatusCard icon="🛂" label="Visa" value={t(...VISA_LABEL[data.status.visa_status])} />
            <StatusCard icon="✈️" label="Flight" value={t(...FLIGHT_LABEL[data.status.flight_status])} />
          </View>

          {(data.status.flight_airline || data.status.flight_date || data.status.flight_pnr) && (
            <View style={styles.infoBox}>
              {!!data.status.flight_airline && <Text style={styles.infoText}>Airline: {data.status.flight_airline}</Text>}
              {!!data.status.flight_date && <Text style={styles.infoText}>Flight Date: {data.status.flight_date}</Text>}
              {!!data.status.flight_pnr && <Text style={styles.infoText}>PNR: {data.status.flight_pnr}</Text>}
            </View>
          )}

          {!!data.status.remarks && (
            <View style={styles.remarksBox}>
              <Text style={styles.remarksTitle}>📝 {t('মন্তব্য (Admin)', 'Remarks (Admin)')}</Text>
              <Text style={styles.remarksText}>{data.status.remarks}</Text>
            </View>
          )}

          {data.status.updated_at && (
            <Text style={styles.updatedText}>
              {t('সর্বশেষ আপডেট', 'Last Updated')}: {data.status.updated_at.slice(0, 19).replace('T', ' ')}
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatusCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  headerBar: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  timelineCard: { backgroundColor: Brand.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Brand.border },
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineIconCol: { alignItems: 'center' },
  timelineDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: Brand.blue },
  timelineLine: { width: 2, flex: 1, backgroundColor: Brand.border, marginTop: 2 },
  timelineLineDone: { backgroundColor: Brand.blue },
  timelineLabel: { fontSize: 13, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 10 },
  statusCard: { flex: 1, backgroundColor: Brand.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Brand.border, gap: 4 },
  statusLabel: { fontSize: 10, color: Brand.textMuted },
  statusValue: { fontSize: 12, fontWeight: '700', color: Brand.primary },
  infoBox: { backgroundColor: Brand.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Brand.border, gap: 4 },
  infoText: { fontSize: 12, color: Brand.text },
  remarksBox: { backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, gap: 6 },
  remarksTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  remarksText: { fontSize: 12, color: '#92400E' },
  updatedText: { fontSize: 11, color: Brand.textMuted, textAlign: 'center' },
});
