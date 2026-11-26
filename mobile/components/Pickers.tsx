import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { colors, glass, glassShadow } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { T } from './ui';

export type Option = [key: string, label: string];

/** 2 to 4 choices, always fully visible: no swiping, no wrapping. The selected pill slides to the new choice. */
export function Segmented({ options, value, onChange }: { options: Option[]; value: string; onChange: (key: string) => void }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex(([k]) => k === value));
  const x = useRef(new Animated.Value(idx)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce) Animated.timing(x, { toValue: idx, duration: 0, useNativeDriver: true }).start();
    else Animated.spring(x, { toValue: idx, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [idx, x, reduce]);
  const seg = w ? (w - 6) / options.length : 0;
  const translateX = useMemo(() => x.interpolate({ inputRange: [0, Math.max(1, options.length - 1)], outputRange: [0, seg * Math.max(1, options.length - 1)] }), [x, seg, options.length]);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', backgroundColor: glass.tint, borderWidth: 1, borderColor: glass.edge, borderRadius: 14, padding: 3, marginBottom: 12 }}>
      {w > 0 ? <Animated.View style={{ position: 'absolute', top: 3, left: 3, width: seg, height: 36, borderRadius: 11, backgroundColor: colors.navy, transform: [{ translateX }] }} /> : null}
      {options.map(([key, label]) => {
        const active = key === value;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={({ pressed }) => [{ flex: 1, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, pressed && !active && { opacity: 0.6 }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? colors.white : colors.ink }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Dropdown for longer lists: shows the current choice and opens a bottom sheet with every option. */
export function SelectPill({ label, value, options, onChange, placeholder = 'Select', title }: { label: string; value: string; options: Option[]; onChange: (key: string) => void; placeholder?: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const current = options.find(([k]) => k === value)?.[1];
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: glass.strong, borderRadius: 14, borderWidth: 1, borderColor: glass.edge, paddingHorizontal: 14, height: 46, marginBottom: 12, ...glassShadow }, pressed && { transform: [{ scale: 0.99 }] }]}>
        <T v="small" style={{ fontWeight: '600' }}>{label}</T>
        <T v="h3" color={current ? colors.navy : colors.muted} style={{ flex: 1, textAlign: 'right', fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{current ?? placeholder}</T>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(27,39,71,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable onPress={() => undefined} style={{ backgroundColor: 'rgba(243,242,248,0.97)', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, maxHeight: '75%' }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 }} />
            <T v="h2" style={{ marginBottom: 6 }}>{title ?? label}</T>
            {options.map(([key, text]) => (
              <Pressable key={key} onPress={() => { onChange(key); setOpen(false); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, opacity: pressed ? 0.6 : 1, borderBottomWidth: 1, borderBottomColor: colors.line })}>
                <T v="h3" color={key === value ? colors.navy : colors.ink} style={{ fontWeight: key === value ? '800' : '500' }}>{text}</T>
                {key === value ? <Check size={20} color={colors.gold} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
