import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths, UploadType } from 'expo-file-system';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuestPrompt } from './(tabs)/applications';
import { LoadingView } from '@/components/state-views';
import { Brand } from '@/constants/theme';
import { api, apiUrl, authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import type { ChatMessage } from '@/lib/types';

const POLL_MS = 4000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const SENDER_LABEL: Record<ChatMessage['sender_type'], [string, string]> = {
  user: ['আপনি', 'You'],
  admin: ['👨‍💼 Office Team', '👨‍💼 Office Team'],
  ai: ['🤖 GO Assistant', '🤖 GO Assistant'],
};

type UploadState = { kind: 'image' | 'video'; progress: number } | null;

export default function ChatScreen() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [fileHeaders, setFileHeaders] = useState<Record<string, string>>({});
  const [attachmentSheetOpen, setAttachmentSheetOpen] = useState(false);
  const [upload, setUpload] = useState<UploadState>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async (markRead: boolean) => {
    try {
      const data = await api.get<{ messages: ChatMessage[] }>(`/api/chat?read=${markRead ? 1 : 0}`);
      setMessages(data.messages);
    } catch {
      // Keep showing whatever was last loaded — the input area still works.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    authHeaders().then(setFileHeaders);
    void (async () => {
      await load(true);
    })();
    const interval = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(interval);
  }, [user, load]);

  function scrollToEnd() {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  async function send() {
    const message = text.trim();
    if (!message) return;
    setSending(true);
    try {
      await api.post('/api/chat', { message });
      // Only clear the draft once the send actually succeeds, so a failed
      // send (e.g. offline) leaves the message in the box to retry.
      setText('');
      await load(false);
      scrollToEnd();
    } catch {
      Alert.alert(
        t('Message পাঠানো যায়নি', 'Could not send'),
        t('আবার চেষ্টা করুন।', 'Please try again.'),
        [{ text: t('ঠিক আছে', 'OK') }],
      );
    } finally {
      setSending(false);
    }
  }

  async function pickAttachment(kind: 'image' | 'video') {
    setAttachmentSheetOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('', t('গ্যালারি অনুমতি প্রয়োজন।', 'Gallery permission is required.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'image' ? ['images'] : ['videos'],
      quality: kind === 'image' ? 0.8 : undefined,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (asset.fileSize && asset.fileSize > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      Alert.alert('', t(`ফাইল সর্বোচ্চ ${mb}MB হতে পারবে।`, `File must be under ${mb}MB.`));
      return;
    }

    await uploadAttachment(asset.uri, asset.mimeType ?? (kind === 'image' ? 'image/jpeg' : 'video/mp4'), kind);
  }

  async function uploadAttachment(uri: string, mime: string, kind: 'image' | 'video') {
    setUpload({ kind, progress: 0 });
    try {
      const headers = await authHeaders();
      const file = new File(uri);
      const task = file.createUploadTask(apiUrl('/api/chat/upload'), {
        httpMethod: 'POST',
        uploadType: UploadType.MULTIPART,
        fieldName: 'file',
        mimeType: mime,
        parameters: { kind: 'media' },
        headers,
        onProgress: (p) => {
          if (p.totalBytes > 0) setUpload({ kind, progress: p.bytesSent / p.totalBytes });
        },
      });

      const result = await task.uploadAsync();
      if (!result || result.status < 200 || result.status >= 300) {
        let serverMessage = '';
        try {
          serverMessage = (JSON.parse(result?.body ?? '{}') as { error?: string }).error ?? '';
        } catch {
          // Ignore — fall back to the generic message below.
        }
        throw new Error(serverMessage || 'upload failed');
      }

      await load(false);
      scrollToEnd();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      Alert.alert(
        t('আপলোড ব্যর্থ হয়েছে', 'Upload failed'),
        message && message !== 'upload failed'
          ? message
          : t('ফাইল আপলোড করা যায়নি। আবার চেষ্টা করুন।', 'Could not upload the file. Please try again.'),
      );
    } finally {
      setUpload(null);
    }
  }

  async function openAttachment(msg: ChatMessage) {
    if (!msg.attachment_key) return;
    try {
      const headers = await authHeaders();
      const destination = new File(Paths.cache, msg.attachment_name ?? 'attachment');
      const downloaded = await File.downloadFileAsync(
        apiUrl(`/api/chat/file?messageId=${msg.id}&download=1`),
        destination,
        { headers, idempotent: true },
      );
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(downloaded.uri);
    } catch {
      Alert.alert('', t('Attachment খোলা যায়নি।', 'Could not open the attachment.'));
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <View style={styles.screen}>
        <GuestPrompt
          text={t('Office Chat ব্যবহার করতে Login করুন।', 'Log in to use Office Chat.')}
          onLogin={() => router.push('/login')}
        />
      </View>
    );
  }

  if (loading) return <LoadingView />;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      // Android already resizes the window when the keyboard opens
      // (Expo's default windowSoftInputMode is "resize"); layering
      // behavior="height" on top of that double-compensates and is what
      // was pushing the composer behind the keyboard on real devices.
      // Letting Android's native resize handle it entirely (behavior
      // undefined) and only compensating manually on iOS is the correct
      // pattern here.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={listRef}
        data={messages ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            👋 {t('হ্যালো! কী খুঁজছেন? আমাদের সাথে চ্যাট শুরু করুন।', 'Hello! Start a conversation with us.')}
          </Text>
        }
        renderItem={({ item }) => (
          <MessageBubble item={item} fileHeaders={fileHeaders} onOpenAttachment={() => openAttachment(item)} />
        )}
      />

      {upload && (
        <View style={styles.uploadBar}>
          <ActivityIndicator size="small" color={Brand.blue} />
          <Text style={styles.uploadBarText}>
            {upload.kind === 'image' ? t('ছবি আপলোড হচ্ছে...', 'Uploading image...') : t('ভিডিও আপলোড হচ্ছে...', 'Uploading video...')}{' '}
            {Math.round(upload.progress * 100)}%
          </Text>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable
          style={styles.attachButton}
          onPress={() => setAttachmentSheetOpen(true)}
          disabled={!!upload}
          hitSlop={8}>
          <Text style={{ fontSize: 20, color: Brand.blue }}>+</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder={t('Message লিখুন...', 'Type a message...')}
          placeholderTextColor={Brand.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={scrollToEnd}
          multiline
        />
        <Pressable style={styles.sendButton} disabled={sending || !text.trim()} onPress={send} hitSlop={8}>
          <Text style={styles.sendButtonText}>➤</Text>
        </Pressable>
      </View>

      <Modal visible={attachmentSheetOpen} transparent animationType="fade" onRequestClose={() => setAttachmentSheetOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setAttachmentSheetOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable style={styles.sheetRow} onPress={() => pickAttachment('image')}>
              <Text style={styles.sheetRowText}>📷 {t('ছবি নির্বাচন করুন', 'Choose Image')}</Text>
            </Pressable>
            <Pressable style={styles.sheetRow} onPress={() => pickAttachment('video')}>
              <Text style={styles.sheetRowText}>🎥 {t('ভিডিও নির্বাচন করুন', 'Choose Video')}</Text>
            </Pressable>
            <Pressable style={[styles.sheetRow, styles.sheetRowCancel]} onPress={() => setAttachmentSheetOpen(false)}>
              <Text style={[styles.sheetRowText, { color: Brand.red }]}>❌ {t('বাতিল', 'Cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  item,
  fileHeaders,
  onOpenAttachment,
}: {
  item: ChatMessage;
  fileHeaders: Record<string, string>;
  onOpenAttachment: () => void;
}) {
  const { t } = useLanguage();
  const isUser = item.sender_type === 'user';
  const isImage = item.attachment_kind === 'media' && (item.attachment_mime ?? '').startsWith('image/');
  const isVideo = item.attachment_kind === 'media' && (item.attachment_mime ?? '').startsWith('video/');
  const isOtherFile = !!item.attachment_key && !isImage && !isVideo;
  // The filename is also used as the message text for attachment-only
  // sends (see app/api/chat/upload/route.ts) — don't show it twice as a
  // redundant text line above the image/video.
  const hasSeparateText = !!item.message && item.message !== item.attachment_name;

  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleOther, (isImage || isVideo) && styles.bubbleMedia]}>
        {!isUser && <Text style={styles.senderLabel}>{t(...SENDER_LABEL[item.sender_type])}</Text>}

        {isImage && (
          <Pressable onPress={onOpenAttachment}>
            <Image
              source={{ uri: apiUrl(`/api/chat/file?messageId=${item.id}`), headers: fileHeaders }}
              style={styles.attachmentImage}
              contentFit="cover"
            />
          </Pressable>
        )}

        {isVideo && (
          <VideoAttachment
            uri={apiUrl(`/api/chat/file?messageId=${item.id}`)}
            headers={fileHeaders}
            onOpenExternally={onOpenAttachment}
          />
        )}

        {hasSeparateText && (
          <Text style={[styles.bubbleText, isUser && { color: Brand.white }, (isImage || isVideo) && { marginTop: 6 }]}>
            {item.message}
          </Text>
        )}

        {isOtherFile && (
          <Pressable style={styles.attachmentChip} onPress={onOpenAttachment}>
            <Text style={{ fontSize: 14 }}>{item.attachment_kind === 'audio' ? '🎤' : '📎'}</Text>
            <Text style={[styles.attachmentText, isUser && { color: Brand.white }]} numberOfLines={1}>
              {item.attachment_name ?? t('ফাইল', 'File')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function VideoAttachment({
  uri,
  headers,
  onOpenExternally,
}: {
  uri: string;
  headers: Record<string, string>;
  onOpenExternally: () => void;
}) {
  const player = useVideoPlayer({ uri, headers }, (p) => {
    p.loop = false;
  });

  return (
    <Pressable onLongPress={onOpenExternally}>
      <VideoView player={player} style={styles.attachmentVideo} nativeControls contentFit="cover" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  emptyText: { textAlign: 'center', color: Brand.textMuted, marginTop: 40, paddingHorizontal: 24, lineHeight: 20 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMedia: { padding: 6 },
  bubbleUser: { backgroundColor: Brand.blue, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.border, borderBottomLeftRadius: 4 },
  senderLabel: { fontSize: 10, fontWeight: '700', color: Brand.textMuted, marginBottom: 3, marginLeft: 6, marginTop: 4 },
  bubbleText: { fontSize: 14, color: Brand.text, lineHeight: 19 },
  attachmentImage: { width: 200, height: 200, borderRadius: 12, backgroundColor: '#00000010' },
  attachmentVideo: { width: 220, height: 220, borderRadius: 12, backgroundColor: '#000' },
  attachmentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 6 },
  attachmentText: { fontSize: 12, fontWeight: '600', color: Brand.text, maxWidth: 160 },
  uploadBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EFF6FF', borderTopWidth: 1, borderTopColor: Brand.border },
  uploadBarText: { fontSize: 12, fontWeight: '600', color: Brand.blue },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: Brand.white,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.text,
    maxHeight: 100,
  },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: Brand.blue, alignItems: 'center', justifyContent: 'center' },
  sendButtonText: { color: Brand.white, fontSize: 16, fontWeight: '700' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 },
  sheetRow: { paddingHorizontal: 22, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Brand.border },
  sheetRowCancel: { marginTop: 4 },
  sheetRowText: { fontSize: 15, fontWeight: '700', color: Brand.text },
});
