import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * Two-sided card that flips around its vertical axis. The front sets the height; the back is stretched to match.
 * Only the visible side receives touches.
 */
export function FlipCard({ flipped, front, back, style }: { flipped: boolean; front: React.ReactNode; back: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(flipped ? 1 : 0)).current;
  const [h, setH] = useState(0);
  const reduce = useReduceMotion();
  useEffect(() => {
    Animated.timing(v, { toValue: flipped ? 1 : 0, duration: reduce ? 0 : 480, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, [flipped, v, reduce]);
  const frontRot = useRef(v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })).current;
  const backRot = useRef(v.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] })).current;
  return (
    <View style={style}>
      <Animated.View
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
        pointerEvents={flipped ? 'none' : 'auto'}
        style={{ backfaceVisibility: 'hidden', transform: [{ perspective: 1200 }, { rotateY: frontRot }] }}
      >
        {front}
      </Animated.View>
      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h || undefined, backfaceVisibility: 'hidden', transform: [{ perspective: 1200 }, { rotateY: backRot }] }}
      >
        {back}
      </Animated.View>
    </View>
  );
}
