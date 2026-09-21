import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand } from '@/constants/theme';

/**
 * Password field with a Show/Hide toggle, explicit dark text color, and a
 * readable placeholder — the plain TextInput + secureTextEntry combo used
 * to render invisible/low-contrast text on some Android devices.
 */
export function PasswordInput({ style, ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, style]}
        placeholderTextColor={Brand.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={styles.toggle} onPress={() => setVisible((v) => !v)} hitSlop={10}>
        <Text style={styles.toggleText}>{visible ? '🙈' : '👁️'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingRight: 46,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.text,
    backgroundColor: Brand.white,
  },
  toggle: { position: 'absolute', right: 12, padding: 4 },
  toggleText: { fontSize: 16 },
});
