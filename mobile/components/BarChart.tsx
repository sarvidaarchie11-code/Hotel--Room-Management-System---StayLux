import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { Point } from '@/types';
import { T } from './ui';

/** Simple chart drawn with Views - values come straight from the API (SQLite aggregates). */
export function BarChart({ data, color = colors.gold, height = 130, format }: { data: Point[]; color?: string; height?: number; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <T v="small">No data yet</T>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: height + 36, gap: 8 }}>
      {data.map((d) => (
        <View key={d.label} style={{ flex: 1, alignItems: 'center' }}>
          <T v="small" style={{ fontSize: 10, marginBottom: 3 }} numberOfLines={1}>{format ? format(d.value) : String(d.value)}</T>
          <View style={{ width: '70%', height: Math.max(3, (d.value / max) * height), backgroundColor: color, borderTopLeftRadius: 6, borderTopRightRadius: 6, opacity: d.value ? 1 : 0.35 }} />
          <T v="small" style={{ fontSize: 10, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{d.label}</T>
        </View>
      ))}
    </View>
  );
}

export function HBarChart({ data, color = colors.sage }: { data: Point[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <T v="small">No data yet</T>;
  return (
    <View style={{ gap: 9 }}>
      {data.map((d) => (
        <View key={d.label}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <T v="small">{d.label.replace(/([a-z])([A-Z])/g, '$1 $2')}</T>
            <T v="small" style={{ fontWeight: '700', color: colors.navy }}>{d.value}</T>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.navySoft }}>
            <View style={{ width: `${(d.value / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
          </View>
        </View>
      ))}
    </View>
  );
}
