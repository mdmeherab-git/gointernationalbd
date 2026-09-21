import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Brand } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';

export default function RegisterScreen() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    if (name.trim().length < 2) {
      setError(t('সঠিক নাম দিন।', 'Please enter a valid name.'));
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(phone.trim())) {
      setError(t('সঠিক মোবাইল নম্বর দিন।', 'Please enter a valid mobile number.'));
      return;
    }
    if (password.length < 8) {
      setError(t('Password কমপক্ষে ৮ অক্ষরের হতে হবে।', 'Password must be at least 8 characters.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Password মিলছে না।', 'Passwords do not match.'));
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, password });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Account তৈরি করা যায়নি।', 'Could not create account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('অ্যাকাউন্ট তৈরি করুন', 'Create Account')}</Text>
        <Text style={styles.subtitle}>{t('আপনার GO International BD Account তৈরি করুন', 'Create your GO International BD account')}</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>{t('নাম', 'Full Name')}</Text>
        <TextInput style={styles.input} placeholder={t('আপনার পূর্ণ নাম', 'Your full name')} value={name} onChangeText={setName} />

        <Text style={styles.label}>{t('মোবাইল নম্বর', 'Phone Number')}</Text>
        <TextInput style={styles.input} placeholder="01XXXXXXXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Text style={styles.label}>{t('ইমেইল (ঐচ্ছিক)', 'Email (Optional)')}</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>{t('পাসওয়ার্ড', 'Password')}</Text>
        <TextInput style={styles.input} placeholder={t('কমপক্ষে ৮ অক্ষর', 'At least 8 characters')} secureTextEntry value={password} onChangeText={setPassword} />

        <Text style={styles.label}>{t('পাসওয়ার্ড নিশ্চিত করুন', 'Confirm Password')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('পাসওয়ার্ড আবার লিখুন', 'Re-enter password')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Pressable style={styles.primaryButton} disabled={submitting} onPress={submit}>
          <Text style={styles.primaryButtonText}>{submitting ? '...' : t('অ্যাকাউন্ট তৈরি করুন', 'Create Account')}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>
              {t('আগে থেকেই Account আছে? ', 'Already have an account? ')}
              <Text style={styles.linkAccent}>{t('Login করুন', 'Log In')}</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.background },
  container: { padding: 24, gap: 4, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: Brand.primary, textAlign: 'center', marginTop: 12 },
  subtitle: { fontSize: 13, color: Brand.textMuted, textAlign: 'center', marginBottom: 16 },
  error: { color: Brand.red, fontSize: 13, textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: Brand.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: Brand.white },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 14 },
  linkRow: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 13, color: Brand.textMuted },
  linkAccent: { color: Brand.blue, fontWeight: '700' },
});
