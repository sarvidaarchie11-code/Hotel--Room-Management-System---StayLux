import React, { useEffect, useState } from 'react';
import { SelectPill } from '@/components/Pickers';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { BookingCard } from '@/components/BookingCard';
import { Chip, ChipRow, EmptyState, ErrorBanner, Loading, T, Backdrop } from '@/components/ui';
import { Calendar, Wallet } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { SortControl } from '@/components/SortControl';
import { shadow } from '@/constants/theme';
import { usePaged } from '@/hooks/usePaged';
import { api } from '@/services/api';
import { Booking } from '@/types';
import { label } from '@/utils/format';

const FILTERS = ['All', 'Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Completed', 'Rejected', 'Cancelled'];

export default function Reservations() {
  const router = useRouter();
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [pay, setPay] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { items, loading, error, refreshing, onRefresh, reload, loadMore, loadingMore } = usePaged<Booking>(async (page) => {
    const r = await api.get<{ bookings: Booking[]; hasMore: boolean; counts?: Record<string, number> }>('/admin/bookings', { params: { status: status === 'All' ? undefined : status, sort, pay: pay || undefined, page, pageSize: 12 } });
    if (r.data.counts) setCounts(r.data.counts);
    return { items: r.data.bookings, hasMore: r.data.hasMore };
  }, ['booking', 'payment']);
  useEffect(() => { void reload(); }, [status, sort, pay, reload]);
  const pick = (s: string) => setStatus(s);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={items}
        keyExtractor={(b) => String(b.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
  loadingMore ? <Loading compact /> : undefined
}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T v="h1">Bookings</T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SortControl title="Payment" value={pay} onChange={setPay} highlight={pay !== ''} icon={<Wallet size={18} color={colors.navy} />} options={[['', 'All payments'], ['Unpaid', 'Unpaid'], ['Partly paid', 'Partly paid'], ['Deposit paid', 'Deposit paid'], ['Fully paid', 'Fully paid']]} />
                <SortControl value={sort} onChange={setSort} options={[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['checkin', 'Check-in date'], ['amount', 'Highest amount']]} />
                <Pressable onPress={() => router.push('/manage/calendar')} hitSlop={8} accessibilityLabel="Calendar" style={({ pressed }) => [{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow.soft }, pressed && { transform: [{ scale: 0.94 }] }]}>
                  <Calendar size={18} color={colors.navy} />
                </Pressable>
              </View>
            </View>
            <SelectPill label="Status" value={status} onChange={pick} options={FILTERS.map((f) => [f, `${f === 'All' ? 'All bookings' : label(f)}${counts[f] ? `  ·  ${counts[f]}` : ''}`] as [string, string])} />
            {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No bookings" hint="New guest requests will appear here." />}
        renderItem={({ item, index }) => <BookingCard index={index} booking={item} showGuest onPress={() => router.push({ pathname: '/manage/booking/[id]', params: { id: String(item.id) } })} />}
      />
    </SafeAreaView>
  );
}
