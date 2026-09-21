import { Image } from 'expo-image';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api, resolveAssetUrl } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import type { PublicNotice } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

export default function NoticeViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isBangla } = useLanguage();
  const { data, loading, error, reload } = useApiQuery(() => api.get<{ notices: PublicNotice[] }>('/api/notices'), []);
  const [downloading, setDownloading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const notice = data?.notices.find((n) => n.id === id) ?? null;
  const imageUrl = resolveAssetUrl(notice?.image_url);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  async function download() {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      const destination = new File(Paths.cache, `notice-${notice!.id}.jpg`);
      const file = await File.downloadFileAsync(imageUrl, destination, { idempotent: true });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch (err) {
      Alert.alert(
        '',
        t(
          `ছবি ডাউনলোড করা যায়নি। ${err instanceof Error ? err.message : ''}`,
          `Could not download the image. ${err instanceof Error ? err.message : ''}`,
        ),
      );
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

      {imageUrl ? (
        imageFailed ? (
          <ErrorView
            message={t('ছবিটি লোড করা যায়নি।', 'Could not load the image.')}
            onRetry={() => {
              setImageFailed(false);
              setImageLoading(true);
            }}
          />
        ) : (
          <ScrollView
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent>
            {imageLoading && (
              <ActivityIndicator style={StyleSheet.absoluteFill} color={Brand.blue} size="large" />
            )}
            <Image
              source={{ uri: imageUrl }}
              style={{ width: screenWidth - 32, height: screenHeight * 0.6 }}
              contentFit="contain"
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageFailed(true);
              }}
            />
          </ScrollView>
        )
      ) : (
        <EmptyView icon="📋" text={t('এই নোটিশে কোনো ছবি নেই।', 'This notice has no image.')} />
      )}

      {imageUrl && !imageFailed && (
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
