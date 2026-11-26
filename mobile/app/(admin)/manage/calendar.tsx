import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, fontSizes } from '@/constants/theme';
import { EmptyState, ErrorBanner, Header, Loading, Screen, T } from '@/components/ui';
import { useLoad } from '@/hooks/useLoad';
import { api } from '@/services/api';
import { CalendarData } from '@/types';

const CELL = 34;
const LABEL_W = 74;
const TONE: Record<string, string> = { Pending: colors.calPending, Confirmed: colors.gold, CheckedIn: colors.sage, CheckedOut: colors.calDone, Completed: colors.calDone };

export default function OccupancyCalendar() {
  const router = useRouter();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const key = format(month, 'yyyy-MM');
  const { data, loading, error, refreshing, onRefresh, reload } = useLoad(() => api.get<CalendarData>('/admin/calendar', { params: { month: key } }).then((r) => r.data), ['booking', 'room'], `cal-${key}`);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((d) => format(d, 'yyyy-MM-dd'));
  const today = format(new Date(), 'yyyy-MM-dd');
  // a night belongs to a booking when checkIn <= day < checkOut
  const cellBooking = (roomId: number, d: string) => data?.bookings.find((b) => b.roomId === roomId && b.checkIn <= d && d < b.checkOut);

  return (
    <Screen scroll={false} padded={false}>
      <Header title="Occupancy calendar" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 }}>
        <Pressable hitSlop={10} accessibilityLabel="Previous month" onPress={() => setMonth(addMonths(month, -1))}><ChevronLeft color={colors.navy} size={24} /></Pressable>
        <T v="h2">{format(month, 'MMMM yyyy')}</T>
        <Pressable hitSlop={10} accessibilityLabel="Next month" onPress={() => setMonth(addMonths(month, 1))}><ChevronRight color={colors.navy} size={24} /></Pressable>
      </View>
      {error ? <View style={{ paddingHorizontal: 20 }}><ErrorBanner message={error} onRetry={reload} /></View> : null}
      {loading ? <Loading /> : !data?.rooms.length ? <EmptyState title="No rooms yet" hint="Add rooms to see their bookings here." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
            <View style={{ width: LABEL_W }}>
              <View style={{ height: CELL, justifyContent: 'center' }}><T v="small" style={{ fontWeight: '700' }}>Room</T></View>
              {data.rooms.map((r) => <View key={r.id} style={{ height: CELL, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.line }}><T v="small" color={colors.navy} style={{ fontWeight: '700' }} numberOfLines={1}>{r.roomNumber}</T></View>)}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={{ flexDirection: 'row', height: CELL }}>
                  {days.map((d) => <View key={d} style={{ width: CELL, alignItems: 'center', justifyContent: 'center', backgroundColor: d === today ? colors.goldSoft : 'transparent', borderRadius: 8 }}><T v="small" style={{ fontSize: fontSizes.tiny }} color={d === today ? colors.navy : colors.muted}>{Number(d.slice(8))}</T></View>)}
                </View>
                {data.rooms.map((r) => (
                  <View key={r.id} style={{ flexDirection: 'row', height: CELL, borderTopWidth: 1, borderTopColor: colors.line }}>
                    {days.map((d) => {
                      const b = cellBooking(r.id, d);
                      return (
                        <Pressable key={d} disabled={!b} onPress={() => b && router.push({ pathname: '/manage/booking/[id]', params: { id: String(b.id) } })} style={{ width: CELL, height: CELL - 1, borderLeftWidth: 0.5, borderLeftColor: colors.line, backgroundColor: b ? TONE[b.status] : d === today ? colors.calToday : 'transparent' }} />
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, padding: 20 }}>
            {[['Pending', 'Pending'], ['Confirmed', 'Confirmed'], ['CheckedIn', 'Checked in'], ['CheckedOut', 'Checked out / done']].map(([k, l]) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: TONE[k] }} /><T v="small">{l}</T></View>
            ))}
          </View>
          <T v="small" style={{ paddingHorizontal: 20 }}>Tap a coloured cell to open the booking. Check-out day stays free for the next guest.</T>
        </ScrollView>
      )}
    </Screen>
  );
}
