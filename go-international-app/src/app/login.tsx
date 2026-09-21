import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Brand } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    if (!phone.trim() || !password) {
      setError(t('মোবাইল নম্বর ও Password দিন।', 'Enter mobile number and password.'));
      return;
    }
    setSubmitting(true);
    try {
      await login(phone.trim(), password);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Login করা যায়নি।', 'Login failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('Login', 'Login')}</Text>
        <Text style={styles.subtitle}>{t('আপনার Account-এ Login করুন', 'Log in to your account')}</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>{t('মোবাইল নম্বর', 'Phone Number')}</Text>
        <TextInput
          style={styles.input}
          placeholder="01XXXXXXXXX"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>{t('পাসওয়ার্ড', 'Password')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('আপনার Password', 'Your password')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primaryButton} disabled={submitting} onPress={submit}>
          <Text style={styles.primaryButtonText}>{submitting ? '...' : t('Login করুন', 'Login')}</Text>
        </Pressable>

        <Link href="/register" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>
              {t('Account নেই? ', 'No account? ')}
              <Text style={styles.linkAccent}>{t('Create Account', 'Create Account')}</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.background },
  container: { padding: 24, gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: Brand.primary, textAlign: 'center', marginTop: 12 },
  subtitle: { fontSize: 13, color: Brand.textMuted, textAlign: 'center', marginBottom: 20 },
  error: { color: Brand.red, fontSize: 13, textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: Brand.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: Brand.white },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 14 },
  linkRow: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 13, color: Brand.textMuted },
  linkAccent: { color: Brand.blue, fontWeight: '700' },
});
