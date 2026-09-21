import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

export type PickerOption = { value: string; label: string };

/** Small reusable bottom-sheet-style option picker (visa type, and any
 *  other short fixed-option field) — kept separate from CountryPickerModal
 *  since it doesn't need search over 255 rows. */
export function OptionPickerModal({
  open,
  onClose,
  onSelect,
  title,
  options,
  selectedValue,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  options: PickerOption[];
  selectedValue?: string | null;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.row, opt.value === selectedValue && styles.rowSelected]}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}>
              <Text style={styles.rowText}>{opt.label}</Text>
              {opt.value === selectedValue && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    marginBottom: 6,
  },
  title: { fontSize: 15, fontWeight: '800', color: Brand.primary },
  closeText: { fontSize: 18, color: Brand.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  rowSelected: { backgroundColor: '#EFF6FF' },
  rowText: { fontSize: 14, fontWeight: '600', color: Brand.text },
  checkmark: { color: Brand.blue, fontWeight: '800', fontSize: 16 },
});
