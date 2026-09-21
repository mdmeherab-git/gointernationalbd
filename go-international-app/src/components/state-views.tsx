import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useLanguage } from '@/lib/language';

/** Loading / empty / error states shared by every API-backed screen (Phase
 *  29: every API screen needs loading, empty, error, and retry). */

export function LoadingView({ label }: { label?: string }) {
  const { t } = useLanguage();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Brand.blue} size="large" />
      <Text style={styles.muted}>{label ?? t('লোড হচ্ছে...', 'Loading...')}</Text>
    </View>
  );
}

export function EmptyView({ icon = '📭', text }: { icon?: string; text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>{t('আবার চেষ্টা করুন', 'Retry')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  icon: { fontSize: 40 },
  muted: { color: Brand.textMuted, fontSize: 14, textAlign: 'center' },
  errorText: { color: Brand.red, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  retryButton: {
    marginTop: 6,
    backgroundColor: Brand.blue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: Brand.white, fontWeight: '700', fontSize: 13 },
});
