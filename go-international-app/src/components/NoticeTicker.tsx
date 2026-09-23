import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Brand, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/language';

const GAP = 48;

/**
 * Compact horizontal notice ticker matching the website's own "বিশেষ
 * বিজ্ঞপ্তি" marquee (app/page.tsx's "SCROLLING NOTICE BOARD" section) —
 * a fixed blue label on the left that never moves, and the notice text
 * scrolling continuously on the right. CSS `animation` (what the website
 * uses) has no RN equivalent, so this drives the same continuous loop
 * with react-native-reanimated: the text is rendered twice back to back,
 * and translateX runs from 0 to -(textWidth + gap) on a linear timing
 * loop — when it resets, the second copy is sitting exactly where the
 * first one started, so the loop has no visible seam.
 */
export function NoticeTicker({
  text,
  speedSeconds,
  direction,
}: {
  text: string;
  speedSeconds: number;
  direction: 'left' | 'right';
}) {
  const { t } = useLanguage();
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useSharedValue(0);

  function onTextLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - textWidth) > 0.5) setTextWidth(width);
  }

  useEffect(() => {
    if (!textWidth) return;
    const distance = textWidth + GAP;
    const duration = Math.max(5, speedSeconds) * 1000;

    if (direction === 'right') {
      translateX.value = -distance;
      translateX.value = withRepeat(withTiming(0, { duration, easing: Easing.linear }), -1, false);
    } else {
      translateX.value = 0;
      translateX.value = withRepeat(withTiming(-distance, { duration, easing: Easing.linear }), -1, false);
    }
  }, [textWidth, speedSeconds, direction, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  if (!text) return null;

  return (
    <View style={styles.bar}>
      <View style={styles.label}>
        <Text style={styles.labelText} numberOfLines={1}>
          📢 {t('বিশেষ বিজ্ঞপ্তি', 'Special Notice')}
        </Text>
      </View>

      <View style={styles.viewport}>
        <Animated.View style={[styles.row, animatedStyle]}>
          <Text style={styles.noticeText} numberOfLines={1} onLayout={onTextLayout}>
            {text}
          </Text>
          <Text style={[styles.noticeText, { marginLeft: GAP }]} numberOfLines={1}>
            {text}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    backgroundColor: Brand.blue,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  labelText: { color: Brand.white, fontSize: 11.5, fontWeight: '700' },
  viewport: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  row: { flexDirection: 'row', paddingVertical: 10 },
  noticeText: { fontSize: 12.5, fontWeight: '600', color: '#0B2A55' },
});
