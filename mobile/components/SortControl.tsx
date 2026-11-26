import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { ArrowUpDown, Check } from 'lucide-react-native';
import { colors, glass, glassShadow } from '@/constants/theme';
import { T } from './ui';

/** Round sort button that opens a small bottom sheet - keeps screens to one row of filters. */
export function SortControl({ value, options, onChange, title = 'Sort by', icon, highlight }: { value: string; options: [string, string][]; onChange: (key: string) => void; title?: string; icon?: React.ReactNode; highlight?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} accessibilityLabel="Sort" style={({ pressed }) => [{ width: 42, height: 42, borderRadius: 21, backgroundColor: glass.strong, borderWidth: 1, borderColor: glass.edge, alignItems: 'center', justifyContent: 'center', ...glassShadow }, pressed && { transform: [{ scale: 0.94 }] }]}>
        {icon ?? <ArrowUpDown size={18} color={colors.navy} />}
        {highlight ? <View style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold, borderWidth: 2, borderColor: colors.white }} /> : null}
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(27,39,71,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable onPress={() => undefined} style={{ backgroundColor: 'rgba(243,242,248,0.97)', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 }} />
            <T v="h2" style={{ marginBottom: 6 }}>{title}</T>
            {options.map(([key, label]) => (
              <Pressable key={key} onPress={() => { onChange(key); setOpen(false); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, opacity: pressed ? 0.6 : 1, borderBottomWidth: 1, borderBottomColor: colors.line })}>
                <T v="h3" color={key === value ? colors.navy : colors.ink} style={{ fontWeight: key === value ? '800' : '500' }}>{label}</T>
                {key === value ? <Check size={20} color={colors.gold} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
