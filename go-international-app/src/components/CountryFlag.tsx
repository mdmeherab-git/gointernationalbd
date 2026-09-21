import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { FLAGS } from '@/lib/flags';

/** Renders the real flag artwork (same SVGs the website uses, pre-rendered
 *  to PNG at build time — see scripts/generate-flags.js) for a given ISO
 *  3166-1 alpha-2 code. Falls back to a generic globe glyph for missing,
 *  empty, or unrecognized codes (free-text admin data sometimes has no
 *  valid country code) instead of a random emoji flag. */
export function CountryFlag({ code, width = 28, height = 21 }: { code?: string | null; width?: number; height?: number }) {
  const source = code ? FLAGS[code.toLowerCase()] : undefined;

  if (!source) {
    return (
      <View style={[styles.fallback, { width, height, borderRadius: Math.min(width, height) * 0.15 }]}>
        <Text style={{ fontSize: Math.min(width, height) * 0.7 }}>🌐</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={{ width, height, borderRadius: Math.min(width, height) * 0.15 }}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
