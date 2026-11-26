import React from 'react';
import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export function StarRating({ value, onChange, size = 18 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} hitSlop={6} accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}>
          <Star size={size} color={colors.gold} fill={n <= Math.round(value) ? colors.gold : 'none'} />
        </Pressable>
      ))}
    </View>
  );
}
