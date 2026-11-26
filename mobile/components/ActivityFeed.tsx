import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { BedDouble, CalendarCheck, CreditCard, Star, UserRound } from 'lucide-react-native';
import { colors, glass, glassShadow } from '@/constants/theme';
import { usePaged } from '@/hooks/usePaged';
import { api } from '@/services/api';
import { ActivityItem } from '@/types';
import { EmptyState, ErrorBanner, Loading, Reveal, T } from './ui';
import { SelectPill } from './Pickers';

const ICONS = { booking: CalendarCheck, stay: BedDouble, payment: CreditCard, review: Star, account: UserRound };
const dayLabel = (iso: string) => { const d = new Date(iso); return isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEE, MMM d'); };

type Row = { type: 'day'; key: string; label: string } | { type: 'item'; key: string; item: ActivityItem };

/** The signed-in guest's own history, newest first, grouped by day. The server only ever returns the caller's own entries. */
export function ActivityFeed() {
  const router = useRouter();
  const [type, setType] = useState('');
  const { items, loading, error, refreshing, onRefresh, reload, loadMore, loadingMore } = usePaged<ActivityItem>(async (page) => {
    const r = await api.get<{ items: ActivityItem[]; hasMore: boolean }>('/activity', { params: { type: type || undefined, page, pageSize: 20 } });
    return { items: r.data.items, hasMore: r.data.hasMore };
  }, ['activity']);
  useEffect(() => { void reload(); }, [type, reload]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let last = '';
    items.forEach((item) => {
      const label = dayLabel(item.createdAt);
      if (label !== last) { out.push({ type: 'day', key: `d-${label}-${item.id}`, label }); last = label; }
      out.push({ type: 'item', key: `i-${item.id}`, item });
    });
    return out;
  }, [items]);

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={rows}
      keyExtractor={(r) => r.key}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
  loadingMore ? <Loading compact /> : undefined
}
      contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}
      ListHeaderComponent={
        <View>
          <SelectPill label="Show" title="Show activity" value={type} onChange={setType} options={[['', 'All activity'], ['bookings', 'Bookings and stays'], ['payments', 'Payments'], ['account', 'Account']]} />
          {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        </View>
      }
      ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No activity yet" hint="Your bookings, payments and account changes will be listed here. Only you can see them." />}
      renderItem={({ item: row, index }) => {
        if (row.type === 'day') return <T v="small" style={{ fontWeight: '700', letterSpacing: 0.6, marginTop: 10, marginBottom: 8 }}>{row.label.toUpperCase()}</T>;
        const { item } = row;
        const Icon = ICONS[item.kind] ?? UserRound;
        const openable = !!item.refId && item.kind !== 'account';
        return (
          <Reveal index={index}>
            <Pressable
              disabled={!openable}
              onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(item.refId) } })}
              style={({ pressed }) => [{ flexDirection: 'row', gap: 12, backgroundColor: glass.fill, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: glass.edge, ...glassShadow }, pressed && openable && { transform: [{ scale: 0.985 }] }]}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={colors.navy} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="h3">{item.title}</T>
                {item.detail ? <T v="small" numberOfLines={3}>{item.detail}</T> : null}
              </View>
              <T v="small" style={{ fontSize: 12 }}>{format(new Date(item.createdAt), 'h:mm a')}</T>
            </Pressable>
          </Reveal>
        );
      }}
    />
  );
}
