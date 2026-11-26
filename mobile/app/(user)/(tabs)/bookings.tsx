import React, { useMemo, useState } from 'react';
import { Segmented } from '@/components/Pickers';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { BookingCard } from '@/components/BookingCard';
import { Button, Chip, EmptyState, ErrorBanner, Loading, T, Backdrop } from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { api } from '@/services/api';
import { Booking } from '@/types';

const ACTIVE = ['Pending', 'Confirmed', 'CheckedIn'];
const FILTERS = ['All', 'Active', 'Past'] as const;

export default function Bookings() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const { items, loading, error, refreshing, onRefresh, reload, loadMore, loadingMore } = usePaged<Booking>(async (page) => {
    const r = await api.get<{ bookings: Booking[]; hasMore: boolean }>('/bookings', { params: { page, pageSize: 10 } });
    return { items: r.data.bookings, hasMore: r.data.hasMore };
  }, ['booking', 'payment']);
  const list = useMemo(() => items.filter((b) => filter === 'All' || (filter === 'Active' ? ACTIVE.includes(b.status) : !ACTIVE.includes(b.status))), [items, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={list}
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
            <T v="h1" style={{ marginBottom: 12 }}>Bookings</T>
            <Segmented value={filter} onChange={(k) => setFilter(k as (typeof FILTERS)[number])} options={FILTERS.map((f) => [f, f] as [string, string])} />
            {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No bookings yet" hint="Reserve a room and it will show up here." action={<Button title="Browse rooms" variant="gold" onPress={() => router.push('/explore')} />} />}
        renderItem={({ item, index }) => <BookingCard index={index} booking={item} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(item.id) } })} />}
      />
    </SafeAreaView>
  );
}
