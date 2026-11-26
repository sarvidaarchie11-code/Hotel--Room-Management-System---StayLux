import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, TextStyle } from 'react-native';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { T } from './ui';

/** Number that counts up to its value (e.g. dashboard totals). */
export function CountUp({ value, format, style }: { value: number; format?: (n: number) => string; style?: TextStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  const reduce = useReduceMotion();
  useEffect(() => {
    const id = v.addListener(({ value: n }) => setShown(n));
    Animated.timing(v, { toValue: value, duration: reduce ? 0 : 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [value, v, reduce]);
  const n = Math.round(shown);
  return <T v="h1" style={style}>{format ? format(n) : String(n)}</T>;
}
