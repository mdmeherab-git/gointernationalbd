import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingView } from '@/components/state-views';
import { OptionPickerModal, type PickerOption } from '@/components/OptionPickerModal';
import { Brand } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import {
  BLOOD_GROUP_OPTIONS,
  EDUCATION_LEVELS,
  emptyCvData,
  HOBBY_PRESETS,
  JOB_CATEGORIES,
  LANGUAGE_LEVELS,
  LANGUAGE_PRESETS,
  MARITAL_STATUS_OPTIONS,
  MAX_LEN,
  mergeCvData,
  RELIGION_OPTIONS,
  SEX_OPTIONS,
  SKILL_PRESETS,
  type CvData,
} from '@/lib/cv';
import { buildCvHtml } from '@/lib/cv-pdf-html';
import { useLanguage } from '@/lib/language';

export default function CvScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [data, setData] = useState<CvData>(emptyCvData);
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const [picker, setPicker] = useState<{
    title: string;
    options: PickerOption[];
    selected: string | null;
    onSelect: (v: string) => void;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Partial<CvData> | null; updatedAt: string | null }>('/api/account/cv');
      setData(mergeCvData(res.data));
      setUpdatedAt(res.updatedAt);
    } catch {
      // Empty CV state below handles this.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  function notify(text: string, kind: 'ok' | 'err' = 'ok') {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 3500);
  }

  function set<K extends keyof CvData>(key: K, value: CvData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function setWork(i: number, patch: Partial<CvData['workExperience'][number]>) {
    setData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((w, idx) => (idx === i ? { ...w, ...patch } : w)),
    }));
  }

  function setEdu(i: number, patch: Partial<CvData['education'][number]>) {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }));
  }

  function setSkill(i: number, patch: Partial<CvData['skills'][number]>) {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function setLang(i: number, patch: Partial<CvData['languages'][number]>) {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    }));
  }

  function setHobby(i: number, value: string) {
    setData((prev) => ({ ...prev, hobbies: prev.hobbies.map((h, idx) => (idx === i ? value : h)) }));
  }

  function setRef(i: number, patch: Partial<CvData['references'][number]>) {
    setData((prev) => ({
      ...prev,
      references: prev.references.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify(t('গ্যালারি অনুমতি প্রয়োজন', 'Gallery permission is required'), 'err');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      // Stored inline as a base64 data URI (exactly like the website's CV
      // Builder — see components/CvBuilder.tsx's `handlePhoto`), so it
      // round-trips through the same /api/account/cv JSON blob and can be
      // dropped straight into the PDF's <img> tag with no separate upload
      // endpoint. Resized+compressed to keep the JSON well under the
      // server's 200KB cap.
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manipulated.base64) throw new Error('no base64');
      set('photo', `data:image/jpeg;base64,${manipulated.base64}`);
    } catch {
      notify(t('ছবি প্রসেস করা যায়নি', 'Could not process photo'), 'err');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function save(silent = false) {
    setSaving(true);
    try {
      await api.put('/api/account/cv', { data });
      setUpdatedAt(new Date().toISOString());
      if (!silent) notify(t('CV সংরক্ষণ হয়েছে', 'CV saved'));
      return true;
    } catch (err) {
      notify(err instanceof ApiError ? err.message : t('সংরক্ষণ করা যায়নি', 'Could not save'), 'err');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf() {
    setGeneratingPdf(true);
    try {
      const html = buildCvHtml(data, true);
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('CV শেয়ার / সংরক্ষণ করুন', 'Share / Save CV'),
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(t('PDF তৈরি হয়েছে', 'PDF created'), uri);
      }
      // Best-effort — the PDF has already been generated either way, so a
      // save failure here must never look like the download itself failed.
      void save(true);
    } catch (err) {
      Alert.alert('', t('PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।', 'Could not generate the PDF. Please try again.'));
      console.error('CV PDF generation error:', err);
    } finally {
      setGeneratingPdf(false);
    }
  }

  const skillOptions: PickerOption[] = useMemo(() => SKILL_PRESETS.map((s) => ({ value: s, label: s })), []);
  const eduLevelOptions: PickerOption[] = useMemo(() => EDUCATION_LEVELS.map((s) => ({ value: s, label: s })), []);
  const jobCategoryOptions: PickerOption[] = useMemo(() => JOB_CATEGORIES.map((s) => ({ value: s, label: s })), []);
  const languageOptions: PickerOption[] = useMemo(() => LANGUAGE_PRESETS.map((s) => ({ value: s, label: s })), []);
  const languageLevelOptions: PickerOption[] = useMemo(() => LANGUAGE_LEVELS.map((s) => ({ value: s, label: s })), []);
  const hobbyOptions: PickerOption[] = useMemo(() => HOBBY_PRESETS.map((s) => ({ value: s, label: s })), []);
  const religionOptions: PickerOption[] = useMemo(() => RELIGION_OPTIONS.map((s) => ({ value: s, label: s })), []);
  const maritalOptions: PickerOption[] = useMemo(() => MARITAL_STATUS_OPTIONS.map((s) => ({ value: s, label: s })), []);
  const sexOptions: PickerOption[] = useMemo(() => SEX_OPTIONS.map((s) => ({ value: s, label: s })), []);
  const bloodOptions: PickerOption[] = useMemo(() => BLOOD_GROUP_OPTIONS.map((s) => ({ value: s, label: s })), []);

  if (loading) return <LoadingView />;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {message && (
          <Text style={[styles.message, message.kind === 'err' ? styles.messageErr : styles.messageOk]}>{message.text}</Text>
        )}

        {updatedAt && (
          <Text style={styles.updatedText}>
            {t('সর্বশেষ আপডেট', 'Last updated')}: {updatedAt.slice(0, 19).replace('T', ' ')}
          </Text>
        )}

        {/* PHOTO */}
        <View style={styles.photoSection}>
          <View style={styles.photoCircle}>
            {data.photo ? (
              <Image source={{ uri: data.photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text style={{ fontSize: 30 }}>🪪</Text>
            )}
            {uploadingPhoto && (
              <View style={[StyleSheet.absoluteFill, styles.photoOverlay]}>
                <ActivityIndicator color={Brand.white} />
              </View>
            )}
          </View>
          <Pressable onPress={pickPhoto} disabled={uploadingPhoto}>
            <Text style={styles.photoLink}>
              {uploadingPhoto ? t('প্রসেস হচ্ছে...', 'Processing...') : t('পাসপোর্ট সাইজ ছবি আপলোড করুন', 'Upload passport-size photo')}
            </Text>
          </Pressable>
        </View>

        {/* PERSONAL INFORMATION */}
        <SectionCard title={t('ব্যক্তিগত তথ্য', 'Personal Information')}>
          <TextField label={t('পূর্ণ নাম', 'Full Name')} value={data.fullName} onChangeText={(v) => set('fullName', v)} maxLength={MAX_LEN.fullName} />
          <TextField label={t('পেশা / পদবী', 'Job Title')} value={data.jobTitle} onChangeText={(v) => set('jobTitle', v)} maxLength={MAX_LEN.jobTitle} />
          <TextField label={t('ইমেইল', 'Email')} value={data.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" maxLength={MAX_LEN.email} />
          <TextField label={t('ফোন নম্বর', 'Phone Number')} value={data.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={MAX_LEN.phone} />
          <TextField label={t('জন্মতারিখ', 'Date of Birth')} value={data.dateOfBirth} onChangeText={(v) => set('dateOfBirth', v)} placeholder="DD/MM/YYYY" />
          <TextField label={t("বাবার নাম", "Father's Name")} value={data.fatherName} onChangeText={(v) => set('fatherName', v)} maxLength={MAX_LEN.fatherMotherName} />
          <TextField label={t("মায়ের নাম", "Mother's Name")} value={data.motherName} onChangeText={(v) => set('motherName', v)} maxLength={MAX_LEN.fatherMotherName} />
          <TextField label={t('বর্তমান ঠিকানা', 'Present Address')} value={data.presentAddress} onChangeText={(v) => set('presentAddress', v)} maxLength={MAX_LEN.address} />
          <TextField label={t('স্থায়ী ঠিকানা', 'Permanent Address')} value={data.permanentAddress} onChangeText={(v) => set('permanentAddress', v)} maxLength={MAX_LEN.address} />
          <TextField label={t('জাতীয়তা', 'Nationality')} value={data.nationality} onChangeText={(v) => set('nationality', v)} />
          <SelectField label={t('ধর্ম', 'Religion')} value={data.religion} placeholder={t('নির্বাচন করুন', 'Select')} onPress={() => setPicker({ title: t('ধর্ম নির্বাচন করুন', 'Select Religion'), options: religionOptions, selected: data.religion, onSelect: (v) => set('religion', v) })} />
          <SelectField label={t('বৈবাহিক অবস্থা', 'Marital Status')} value={data.maritalStatus} placeholder={t('নির্বাচন করুন', 'Select')} onPress={() => setPicker({ title: t('বৈবাহিক অবস্থা', 'Marital Status'), options: maritalOptions, selected: data.maritalStatus, onSelect: (v) => set('maritalStatus', v) })} />
          <SelectField label={t('লিঙ্গ', 'Sex')} value={data.sex} placeholder={t('নির্বাচন করুন', 'Select')} onPress={() => setPicker({ title: t('লিঙ্গ নির্বাচন করুন', 'Select Sex'), options: sexOptions, selected: data.sex, onSelect: (v) => set('sex', v) })} />
          <SelectField label={t('রক্তের গ্রুপ', 'Blood Group')} value={data.bloodGroup} placeholder={t('নির্বাচন করুন', 'Select')} onPress={() => setPicker({ title: t('রক্তের গ্রুপ', 'Blood Group'), options: bloodOptions, selected: data.bloodGroup, onSelect: (v) => set('bloodGroup', v) })} />
        </SectionCard>

        {/* PASSPORT */}
        <SectionCard title={t('পাসপোর্ট তথ্য', 'Passport Information')}>
          <TextField label={t('পাসপোর্ট নম্বর', 'Passport Number')} value={data.passportNumber} onChangeText={(v) => set('passportNumber', v.toUpperCase())} maxLength={MAX_LEN.passportNumber} autoCapitalize="characters" />
          <TextField label={t('পাসপোর্ট ইস্যু', 'Passport Issue')} value={data.passportIssue} onChangeText={(v) => set('passportIssue', v)} placeholder="DD/MM/YYYY" maxLength={MAX_LEN.passportDate} />
          <TextField label={t('পাসপোর্ট মেয়াদ শেষ', 'Passport Expiry')} value={data.passportExpiry} onChangeText={(v) => set('passportExpiry', v)} placeholder="DD/MM/YYYY" maxLength={MAX_LEN.passportDate} />
        </SectionCard>

        {/* ABOUT ME */}
        <SectionCard title={t('নিজের সম্পর্কে', 'About Me')}>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            multiline
            value={data.aboutMe}
            onChangeText={(v) => set('aboutMe', v)}
            placeholderTextColor={Brand.textMuted}
          />
        </SectionCard>

        {/* WORK EXPERIENCE */}
        <SectionCard title={t('কর্ম অভিজ্ঞতা (সর্বোচ্চ ৩টি)', 'Work Experience (up to 3)')}>
          {data.workExperience.map((job, i) => (
            <View key={job.id} style={styles.subCard}>
              <SelectField
                label={t('পদবী', 'Position')}
                value={job.position}
                placeholder={t('নির্বাচন করুন', 'Select')}
                onPress={() => setPicker({ title: t('পদবী নির্বাচন করুন', 'Select Position'), options: jobCategoryOptions, selected: job.position, onSelect: (v) => setWork(i, { position: v }) })}
              />
              <TextField label={t('প্রতিষ্ঠান', 'Company')} value={job.company} onChangeText={(v) => setWork(i, { company: v })} maxLength={MAX_LEN.jobCompany} />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <TextField label={t('শুরু', 'Start')} value={job.startDate} onChangeText={(v) => setWork(i, { startDate: v })} placeholder="YYYY" maxLength={MAX_LEN.jobDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label={t('শেষ', 'End')} value={job.endDate} onChangeText={(v) => setWork(i, { endDate: v })} placeholder="YYYY / Present" maxLength={MAX_LEN.jobDate} />
                </View>
              </View>
              <TextField label={t('বিবরণ', 'Description')} value={job.description} onChangeText={(v) => setWork(i, { description: v })} multiline maxLength={MAX_LEN.jobDescription} />
            </View>
          ))}
        </SectionCard>

        {/* EDUCATION */}
        <SectionCard title={t('শিক্ষাগত যোগ্যতা (সর্বোচ্চ ২টি)', 'Education (up to 2)')}>
          {data.education.map((edu, i) => (
            <View key={edu.id} style={styles.subCard}>
              <SelectField
                label={t('স্তর', 'Level')}
                value={edu.level}
                placeholder={t('নির্বাচন করুন', 'Select')}
                onPress={() => setPicker({ title: t('শিক্ষার স্তর', 'Education Level'), options: eduLevelOptions, selected: edu.level, onSelect: (v) => setEdu(i, { level: v }) })}
              />
              <TextField label={t('প্রতিষ্ঠান', 'Institution')} value={edu.institution} onChangeText={(v) => setEdu(i, { institution: v })} maxLength={MAX_LEN.eduInstitution} />
              <TextField label={t('সাল', 'Year')} value={edu.year} onChangeText={(v) => setEdu(i, { year: v })} placeholder="YYYY" maxLength={MAX_LEN.eduYear} />
            </View>
          ))}
        </SectionCard>

        {/* SKILLS */}
        <SectionCard title={t('দক্ষতা (সর্বোচ্চ ৫টি)', 'Skills (up to 5)')}>
          {data.skills.map((skill, i) => (
            <View key={skill.id} style={styles.subCard}>
              <SelectField
                label={t('দক্ষতা', 'Skill')}
                value={skill.name}
                placeholder={t('নির্বাচন করুন', 'Select')}
                onPress={() => setPicker({ title: t('দক্ষতা নির্বাচন করুন', 'Select Skill'), options: skillOptions, selected: skill.name, onSelect: (v) => setSkill(i, { name: v }) })}
              />
              <Text style={styles.label}>{t('দক্ষতার মাত্রা', 'Skill Level')}</Text>
              <View style={styles.levelRow}>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <Pressable key={lvl} onPress={() => setSkill(i, { level: lvl })} style={[styles.levelDot, skill.level >= lvl && styles.levelDotActive]}>
                    <Text style={[styles.levelDotText, skill.level >= lvl && styles.levelDotTextActive]}>{lvl}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </SectionCard>

        {/* LANGUAGES */}
        <SectionCard title={t('ভাষা (সর্বোচ্চ ৪টি)', 'Languages (up to 4)')}>
          {data.languages.map((lang, i) => (
            <View key={lang.id} style={styles.subCard}>
              <SelectField
                label={t('ভাষা', 'Language')}
                value={lang.name}
                placeholder={t('নির্বাচন করুন', 'Select')}
                onPress={() => setPicker({ title: t('ভাষা নির্বাচন করুন', 'Select Language'), options: languageOptions, selected: lang.name, onSelect: (v) => setLang(i, { name: v }) })}
              />
              <SelectField
                label={t('দক্ষতার মাত্রা', 'Proficiency')}
                value={lang.level}
                placeholder={t('নির্বাচন করুন', 'Select')}
                onPress={() => setPicker({ title: t('দক্ষতার মাত্রা', 'Proficiency'), options: languageLevelOptions, selected: lang.level, onSelect: (v) => setLang(i, { level: v }) })}
              />
            </View>
          ))}
        </SectionCard>

        {/* HOBBIES */}
        <SectionCard title={t('শখ (সর্বোচ্চ ৩টি)', 'Hobbies (up to 3)')}>
          {data.hobbies.map((hobby, i) => (
            <SelectField
              key={i}
              label={`${t('শখ', 'Hobby')} ${i + 1}`}
              value={hobby}
              placeholder={t('নির্বাচন করুন', 'Select')}
              onPress={() => setPicker({ title: t('শখ নির্বাচন করুন', 'Select Hobby'), options: hobbyOptions, selected: hobby, onSelect: (v) => setHobby(i, v) })}
            />
          ))}
        </SectionCard>

        {/* REFERENCES */}
        <SectionCard title={t('রেফারেন্স (সর্বোচ্চ ২টি)', 'References (up to 2)')}>
          {data.references.map((ref, i) => (
            <View key={ref.id} style={styles.subCard}>
              <TextField label={t('নাম', 'Name')} value={ref.name} onChangeText={(v) => setRef(i, { name: v })} maxLength={MAX_LEN.refName} />
              <TextField label={t('ফোন', 'Phone')} value={ref.phone} onChangeText={(v) => setRef(i, { phone: v })} keyboardType="phone-pad" maxLength={MAX_LEN.refPhone} />
              <TextField label={t('ইমেইল', 'Email')} value={ref.email} onChangeText={(v) => setRef(i, { email: v })} keyboardType="email-address" autoCapitalize="none" maxLength={MAX_LEN.refEmail} />
            </View>
          ))}
        </SectionCard>

        <Pressable style={styles.secondaryButton} disabled={saving} onPress={() => save()}>
          <Text style={styles.secondaryButtonText}>{saving ? '...' : t('খসড়া সংরক্ষণ করুন', 'Save Draft')}</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} disabled={generatingPdf} onPress={downloadPdf}>
          {generatingPdf ? (
            <ActivityIndicator color={Brand.white} />
          ) : (
            <Text style={styles.primaryButtonText}>📄 {t('CV PDF ডাউনলোড করুন', 'Download CV PDF')}</Text>
          )}
        </Pressable>
      </ScrollView>

      {picker && (
        <OptionPickerModal
          open
          onClose={() => setPicker(null)}
          onSelect={picker.onSelect}
          title={picker.title}
          selectedValue={picker.selected}
          options={picker.options}
        />
      )}
    </>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'characters';
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Brand.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.selectorField} onPress={onPress}>
        <Text style={[styles.selectorText, !value && { color: Brand.textMuted }]}>{value || placeholder}</Text>
        <Text style={styles.selectorChevron}>▾</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { padding: 20, paddingBottom: 60 },
  message: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginBottom: 12, padding: 10, borderRadius: 10 },
  messageOk: { color: '#166534', backgroundColor: '#DCFCE7' },
  messageErr: { color: '#991B1B', backgroundColor: '#FEE2E2' },
  updatedText: { fontSize: 11, color: Brand.textMuted, marginBottom: 12, textAlign: 'center' },
  photoSection: { alignItems: 'center', gap: 8, marginBottom: 20 },
  photoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoOverlay: { backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  photoLink: { color: Brand.blue, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  section: { backgroundColor: Brand.white, borderRadius: 16, borderWidth: 1, borderColor: Brand.border, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Brand.primary, marginBottom: 14 },
  subCard: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#FAFBFC' },
  row2: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: Brand.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Brand.text, backgroundColor: Brand.white },
  selectorField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Brand.white },
  selectorText: { fontSize: 14, color: Brand.text, fontWeight: '600', flex: 1 },
  selectorChevron: { color: Brand.textMuted, marginLeft: 8 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.white },
  levelDotActive: { backgroundColor: Brand.blue, borderColor: Brand.blue },
  levelDotText: { fontSize: 12, fontWeight: '700', color: Brand.textMuted },
  levelDotTextActive: { color: Brand.white },
  secondaryButton: { borderWidth: 1, borderColor: Brand.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, backgroundColor: Brand.white },
  secondaryButtonText: { color: Brand.text, fontWeight: '700', fontSize: 13 },
  primaryButton: { backgroundColor: Brand.blue, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: Brand.white, fontWeight: '700', fontSize: 14 },
});
