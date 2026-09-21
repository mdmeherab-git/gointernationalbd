import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError, authHeaders, BASE_URL } from '@/lib/api';
import { useLanguage } from '@/lib/language';
import type { UserDocument } from '@/lib/types';
import { useApiQuery } from '@/lib/use-api';

const DOCUMENT_TYPES: UserDocument['document_type'][] = [
  'passport',
  'cv',
  'photo',
  'nid',
  'medical_report',
  'visa_copy',
  'other',
];

const TYPE_LABEL: Record<string, [string, string]> = {
  passport: ['পাসপোর্ট', 'Passport'],
  cv: ['সিভি', 'CV'],
  photo: ['পাসপোর্ট ছবি', 'Passport Photo'],
  nid: ['এনআইডি', 'NID'],
  medical_report: ['মেডিকেল রিপোর্ট', 'Medical Report'],
  visa_copy: ['ভিসা কপি', 'Visa Copy'],
  other: ['অন্যান্য', 'Other'],
};

const MAX_MB = 10;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload, setData } = useApiQuery(() =>
    api.get<{ documents: UserDocument[] }>('/api/account/documents'),
  );
  const [documentType, setDocumentType] = useState<UserDocument['document_type']>('other');
  const [uploading, setUploading] = useState(false);
  const [photoHeaders, setPhotoHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    authHeaders().then(setPhotoHeaders);
  }, []);

  async function uploadDocument() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets[0]) return;

    const asset = picked.assets[0];
    if ((asset.size ?? 0) > MAX_MB * 1024 * 1024) {
      Alert.alert('', t(`Document সর্বোচ্চ ${MAX_MB}MB হতে পারবে।`, `Document must be under ${MAX_MB}MB.`));
      return;
    }

    setUploading(true);
    try {
      const mime = asset.mimeType ?? 'application/octet-stream';

      const presign = await api.post<{ mode: string; uploadUrl?: string; key?: string }>(
        '/api/account/documents/presign',
        { mime, size: asset.size ?? 0, documentType },
      );

      if (presign.mode === 'direct' && presign.uploadUrl && presign.key) {
        const putResponse = await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: { 'content-type': mime },
          body: await (await fetch(asset.uri)).blob(),
        });
        if (!putResponse.ok) throw new ApiError(putResponse.status, t('File upload করা যায়নি।', 'Could not upload file.'));
        await api.post('/api/account/documents/complete', {
          key: presign.key,
          fileName: asset.name,
          mime,
          documentType,
        });
      } else {
        const form = new FormData();
        form.append('file', { uri: asset.uri, name: asset.name, type: mime } as unknown as Blob);
        form.append('documentType', documentType);
        await api.postForm('/api/account/documents', form);
      }

      await reload();
    } catch (err) {
      Alert.alert('', err instanceof ApiError ? err.message : t('File upload করা যায়নি।', 'Could not upload file.'));
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(id: string) {
    Alert.alert(t('মুছে ফেলুন?', 'Delete?'), t('এই document মুছে ফেলতে চান?', 'Delete this document?'), [
      { text: t('বাতিল', 'Cancel'), style: 'cancel' },
      {
        text: t('মুছুন', 'Delete'),
        style: 'destructive',
        onPress: async () => {
          await api.del(`/api/account/documents/${id}`);
          setData((prev) => (prev ? { documents: prev.documents.filter((d) => d.id !== id) } : prev));
        },
      },
    ]);
  }

  async function viewOrDownload(doc: UserDocument) {
    try {
      const headers = await authHeaders();
      const destination = new File(Paths.cache, doc.file_name);
      const downloaded = await File.downloadFileAsync(
        `${BASE_URL}/api/account/documents/${doc.id}/file?download=1`,
        destination,
        { headers, idempotent: true },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      }
    } catch {
      Alert.alert('', t('File খোলা যায়নি।', 'Could not open the file.'));
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.uploadBar}>
        <View style={styles.typeRow}>
          {DOCUMENT_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setDocumentType(type)}
              style={[styles.typeChip, documentType === type && styles.typeChipActive]}>
              <Text style={[styles.typeChipText, documentType === type && styles.typeChipTextActive]}>
                {t(...TYPE_LABEL[type])}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.uploadButton} disabled={uploading} onPress={uploadDocument}>
          <Text style={styles.uploadButtonText}>{uploading ? '...' : `📤 ${t('Document আপলোড করুন', 'Upload Document')}`}</Text>
        </Pressable>
        <Text style={styles.hint}>
          {t(`JPG, PNG, WebP, GIF অথবা PDF · সর্বোচ্চ ${MAX_MB}MB`, `JPG, PNG, WebP, GIF or PDF · Max ${MAX_MB}MB`)}
        </Text>
      </View>

      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && !error && (data?.documents.length ?? 0) === 0 && (
        <EmptyView icon="📋" text={t('এখনো কোনো document আপলোড করা হয়নি।', 'No documents uploaded yet.')} />
      )}
      {!loading && !error && (data?.documents.length ?? 0) > 0 && (
        <FlatList
          data={data!.documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }) => {
            const isImage = item.content_type.startsWith('image/');
            return (
              <View style={styles.docRow}>
                <View style={styles.docThumb}>
                  {isImage ? (
                    <Image
                      source={{ uri: `${BASE_URL}/api/account/documents/${item.id}/file`, headers: photoHeaders }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 20 }}>📄</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName} numberOfLines={1}>
                    {item.file_name}
                  </Text>
                  <Text style={styles.docMeta}>
                    {t(...TYPE_LABEL[item.document_type])} · {formatSize(item.file_size)}
                  </Text>
                </View>
                <Pressable style={styles.iconButton} onPress={() => viewOrDownload(item)}>
                  <Text>⬇</Text>
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => removeDocument(item.id)}>
                  <Text style={{ color: Brand.red }}>✕</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  uploadBar: { padding: Spacing.three, gap: 10, backgroundColor: Brand.white, borderBottomWidth: 1, borderBottomColor: Brand.border },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Brand.border },
  typeChipActive: { backgroundColor: Brand.blue, borderColor: Brand.blue },
  typeChipText: { fontSize: 11, fontWeight: '600', color: Brand.text },
  typeChipTextActive: { color: Brand.white },
  uploadButton: { backgroundColor: Brand.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  uploadButtonText: { color: Brand.white, fontWeight: '700', fontSize: 13 },
  hint: { fontSize: 10, color: Brand.textMuted, textAlign: 'center' },
  listContent: { padding: Spacing.three, gap: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Brand.white, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: Brand.border },
  docThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  docName: { fontSize: 13, fontWeight: '700', color: Brand.text },
  docMeta: { fontSize: 11, color: Brand.textMuted, marginTop: 2 },
  iconButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
});
