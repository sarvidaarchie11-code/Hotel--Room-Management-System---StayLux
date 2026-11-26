import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ymd } from '@/utils/format';
import { T } from './ui';

export interface BlockedRange { checkIn: string; checkOut: string }
interface Props {
  checkIn: string | null;
  checkOut: string | null;
  blocked: BlockedRange[];
  onChange?: (checkIn: string | null, checkOut: string | null) => void; // omit for a read-only availability calendar
}

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DateRangePicker({ checkIn, checkOut, blocked, onChange }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = ymd(new Date());
  const nightBlocked = (d: string) => blocked.some((r) => r.checkIn <= d && d < r.checkOut);

  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map(ymd), [month]);
  const lead = getDay(startOfMonth(month));

  const rangeFree = (from: string, to: string) => {
    for (let d = parseISO(from); ymd(d) < to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      if (nightBlocked(ymd(d))) return false;
    }
    return true;
  };

  const press = (d: string) => {
    if (!onChange) return;
    if (!checkIn || checkOut || d <= checkIn) {
      if (d >= today && !nightBlocked(d)) onChange(d, null); // DATE SELECTION event
      return;
    }
    if (rangeFree(checkIn, d)) onChange(checkIn, d);
    else if (!nightBlocked(d)) onChange(d, null);
  };

  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Pressable hitSlop={10} accessibilityLabel="Previous month" onPress={() => setMonth(addMonths(month, -1))}><ChevronLeft color={colors.navy} size={22} /></Pressable>
        <T v="h3">{format(month, 'MMMM yyyy')}</T>
        <Pressable hitSlop={10} accessibilityLabel="Next month" onPress={() => setMonth(addMonths(month, 1))}><ChevronRight color={colors.navy} size={22} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((w, i) => <View key={i} style={{ width: '14.285%', alignItems: 'center', paddingVertical: 4 }}><T v="small">{w}</T></View>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: lead }).map((_, i) => <View key={`b${i}`} style={{ width: '14.285%', height: 40 }} />)}
        {days.map((d) => {
          const past = d < today;
          const isBlocked = nightBlocked(d);
          const isStart = d === checkIn;
          const isEnd = d === checkOut;
          const inRange = !!checkIn && !!checkOut && d > checkIn && d < checkOut;
          const selected = isStart || isEnd;
          return (
            <Pressable key={d} onPress={() => press(d)} disabled={!onChange} style={{ width: '14.285%', height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.navy : inRange ? colors.goldSoft : isBlocked ? colors.dangerSoft : 'transparent' }}>
                <T v="small" style={{ fontSize: 14, color: selected ? colors.white : past ? colors.disabled : isBlocked ? colors.danger : colors.navy, textDecorationLine: isBlocked && !selected ? 'line-through' : 'none' }}>
                  {Number(d.slice(8))}
                </T>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
        <Legend color={colors.navy} text="Selected" />
        <Legend color={colors.dangerSoft} text="Booked" />
        <Legend color={colors.goldSoft} text="Your stay" />
      </View>
    </View>
  );
}

const Legend = ({ color, text }: { color: string; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} /><T v="small">{text}</T>
  </View>
);
