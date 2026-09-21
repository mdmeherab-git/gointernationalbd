import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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

const SENDER_LABEL: Record<ChatMessage['sender_type'], [string, string]> = {
  user: ['আপনি', 'You'],
  admin: ['👨‍💼 Office Team', '👨‍💼 Office Team'],
  ai: ['🤖 GO Assistant', '🤖 GO Assistant'],
};

export default function ChatScreen() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
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
    void (async () => {
      await load(true);
    })();
    const interval = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(interval);
  }, [user, load]);

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
      listRef.current?.scrollToEnd({ animated: true });
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

  async function openAttachment(msg: ChatMessage) {
    if (!msg.attachment_key) return;
    try {
      const headers = await authHeaders();
      const destination = new File(Paths.cache, msg.attachment_name ?? 'attachment');
      const file = await File.downloadFileAsync(
        apiUrl(`/api/chat/file?messageId=${msg.id}&download=1`),
        destination,
        { headers, idempotent: true },
      );
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
        renderItem={({ item }) => {
          const isUser = item.sender_type === 'user';
          return (
            <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleOther]}>
                {!isUser && <Text style={styles.senderLabel}>{t(...SENDER_LABEL[item.sender_type])}</Text>}
                {!!item.message && (
                  <Text style={[styles.bubbleText, isUser && { color: Brand.white }]}>{item.message}</Text>
                )}
                {!!item.attachment_key && (
                  <Pressable style={styles.attachmentChip} onPress={() => openAttachment(item)}>
                    <Text style={{ fontSize: 14 }}>
                      {item.attachment_kind === 'audio' ? '🎤' : item.attachment_kind === 'media' ? '🖼️' : '📎'}
                    </Text>
                    <Text style={[styles.attachmentText, isUser && { color: Brand.white }]} numberOfLines={1}>
                      {item.attachment_name ?? t('ফাইল', 'File')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          placeholder={t('Message লিখুন...', 'Type a message...')}
          placeholderTextColor={Brand.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable style={styles.sendButton} disabled={sending || !text.trim()} onPress={send} hitSlop={8}>
          <Text style={styles.sendButtonText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  emptyText: { textAlign: 'center', color: Brand.textMuted, marginTop: 40, paddingHorizontal: 24, lineHeight: 20 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: Brand.blue, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.border, borderBottomLeftRadius: 4 },
  senderLabel: { fontSize: 10, fontWeight: '700', color: Brand.textMuted, marginBottom: 3 },
  bubbleText: { fontSize: 14, color: Brand.text, lineHeight: 19 },
  attachmentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 6 },
  attachmentText: { fontSize: 12, fontWeight: '600', color: Brand.text, maxWidth: 160 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: Brand.white,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
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
});
