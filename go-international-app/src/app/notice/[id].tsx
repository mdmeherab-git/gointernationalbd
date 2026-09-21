import { Image } from 'expo-image';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import type { PublicNotice } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

export default function NoticeViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isBangla } = useLanguage();
  const { data, loading, error, reload } = useApiQuery(() => api.get<{ notices: PublicNotice[] }>('/api/notices'), []);
  const [downloading, setDownloading] = useState(false);

  const notice = data?.notices.find((n) => n.id === id) ?? null;
  const screenWidth = Dimensions.get('window').width;

  async function download() {
    if (!notice?.image_url) return;
    setDownloading(true);
    try {
      const destination = new File(Paths.cache, `notice-${notice.id}.jpg`);
      const file = await File.downloadFileAsync(notice.image_url, destination, { idempotent: true });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch {
      Alert.alert('', t('ছবি ডাউনলোড করা যায়নি।', 'Could not download the image.'));
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!notice) return <EmptyView icon="📋" text={t('নোটিশটি পাওয়া যায়নি।', 'This notice could not be found.')} />;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{isBangla ? notice.title_bn : notice.title_en}</Text>
      <Text style={styles.date}>📅 {notice.notice_date}</Text>

      {notice.image_url ? (
        <ScrollView
          style={styles.imageScroll}
          contentContainerStyle={styles.imageScrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          centerContent>
          <Image
            source={{ uri: notice.image_url }}
            style={{ width: screenWidth - 32, aspectRatio: 1 }}
            contentFit="contain"
          />
        </ScrollView>
      ) : (
        <EmptyView icon="📋" text={t('এই নোটিশে কোনো ছবি নেই।', 'This notice has no image.')} />
      )}

      {notice.image_url && (
        <Pressable style={styles.downloadButton} disabled={downloading} onPress={download}>
          <Text style={styles.downloadButtonText}>{downloading ? '...' : `⬇ ${t('ডাউনলোড করুন', 'Download')}`}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background, padding: Spacing.three, gap: 8 },
  title: { fontSize: 16, fontWeight: '800', color: Brand.primary },
  date: { fontSize: 12, color: Brand.textMuted },
  imageScroll: { flex: 1, backgroundColor: Brand.white, borderRadius: 16, marginVertical: 8 },
  imageScrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  downloadButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  downloadButtonText: { color: Brand.white, fontWeight: '700' },
});
