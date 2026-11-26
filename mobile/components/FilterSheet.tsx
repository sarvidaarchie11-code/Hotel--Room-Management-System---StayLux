import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Keyboard, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, glass, overlay } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { StickyFooter, T } from './ui';

/**
 * Bottom sheet drawn inside the screen (not a native Modal), so pickers that open their own Modal can be used inside it.
 * Slides up, dims the screen behind it, closes on back press / tap outside.
 */
export function FilterSheet({ visible, title, onClose, footer, children }: { visible: boolean; title: string; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const [kb, setKb] = useState(0); // keyboard height: the sheet rides above it
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const b = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { a.remove(); b.remove(); };
  }, []);
  const t = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(t, { toValue: 1, duration: reduce ? 0 : 260, useNativeDriver: true }).start();
    } else {
      Animated.timing(t, { toValue: 0, duration: reduce ? 0 : 200, useNativeDriver: true }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [visible, t, reduce]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [visible, onClose]);

  const slide = useMemo(() => t.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }), [t, height]);
  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: overlay.scrim, opacity: t }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close filters" />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: kb, maxHeight: height * 0.88 - kb, transform: [{ translateY: slide }], backgroundColor: 'rgba(243,242,248,0.98)', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: glass.edge, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
          <T v="h2">{title}</T>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' }}><X size={18} color={colors.navy} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8 }}>{children}</ScrollView>
        {footer ? <StickyFooter>{footer}</StickyFooter> : null}
      </Animated.View>
    </View>
  );
}
