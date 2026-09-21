import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountryFlag } from './CountryFlag';
import { Brand } from '@/constants/theme';
import { countries, type Country } from '@/lib/countries';
import { useLanguage } from '@/lib/language';

/**
 * Reusable full-country-list searchable picker (Phase 4/5: one shared
 * component instead of duplicating the country list per screen). Used by
 * the Home Visa Check country field and can be reused anywhere else a
 * country needs picking (job/application filters, etc).
 */
export function CountryPickerModal({
  open,
  onClose,
  onSelect,
  selectedCode,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  selectedCode?: string | null;
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [query]);

  function handleSelect(country: Country) {
    onSelect(country);
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('দেশ নির্বাচন করুন', 'Select Country')}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('দেশ খুঁজুন...', 'Search country...')}
          placeholderTextColor={Brand.textMuted}
          autoFocus
          style={styles.searchInput}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('কোনো দেশ পাওয়া যায়নি।', 'No country found.')}</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, item.code === selectedCode && styles.rowSelected]}
              onPress={() => handleSelect(item)}>
              <CountryFlag code={item.code} />
              <Text style={styles.rowText}>{item.name}</Text>
              {item.code === selectedCode && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  title: { fontSize: 16, fontWeight: '800', color: Brand.primary },
  closeText: { fontSize: 20, color: Brand.textMuted },
  searchInput: {
    margin: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.text,
  },
  emptyText: { textAlign: 'center', color: Brand.textMuted, marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowSelected: { backgroundColor: '#EFF6FF' },
  rowText: { flex: 1, fontSize: 14, color: Brand.text, fontWeight: '600' },
  checkmark: { color: Brand.blue, fontWeight: '800', fontSize: 16 },
});
