import React, { useEffect, useState } from 'react';
import { SelectPill } from '@/components/Pickers';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ROOM_STATUSES, imageUrl } from '@/constants/config';
import { Badge, Button, Card, Chip, ChipRow, EmptyState, ErrorBanner, Input, KeyboardView, Loading, T, Backdrop } from '@/components/ui';
import { SortControl } from '@/components/SortControl';
import { usePaged } from '@/hooks/usePaged';
import { Img } from '@/components/Img';
import { api, errMsg } from '@/services/api';
import { Room } from '@/types';
import { money } from '@/utils/format';

export default function AdminRooms() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('All');
  const [sort, setSort] = useState('newest');
  const { items, loading, error, refreshing, onRefresh, reload, loadMore, loadingMore } = usePaged<Room>(async (page) => {
    const r = await api.get<{ rooms: Room[]; hasMore: boolean }>('/rooms', { params: { search: search.trim() || undefined, status: status === 'All' ? undefined : status, sort, page, pageSize: 12 } });
    return { items: r.data.rooms, hasMore: r.data.hasMore };
  }, ['room', 'booking']);
  useEffect(() => { const t = setTimeout(() => { void reload(); }, 250); return () => clearTimeout(t); }, [search, status, sort, reload]);

  const remove = (r: Room) => Alert.alert('Delete room?', `${r.name} (Room ${r.roomNumber}) and its photos will be permanently deleted.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { // ROOM DELETE
      try { await api.delete(`/admin/rooms/${r.id}`); await reload(); } catch (e) { Alert.alert('Cannot delete', errMsg(e)); }
    } },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <KeyboardView>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={items}
        keyExtractor={(r) => String(r.id)}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <T v="h1">Rooms</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <SortControl value={sort} onChange={setSort} options={[['newest', 'Newest first'], ['number', 'Room number'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low']]} />
                <Button title="Add" variant="gold" small icon={<Plus size={16} color={colors.white} />} onPress={() => router.push('/manage/room-form')} />
              </View>
            </View>
            <Input value={search} onChangeText={setSearch} placeholder="Search number, name, type" icon={<Search size={18} color={colors.muted} />} />
            <SelectPill label="Status" value={status} onChange={setStatus} options={['All', ...ROOM_STATUSES].map((x) => [x, x === 'All' ? 'All rooms' : x] as [string, string])} />
            <Pressable onPress={() => router.push('/manage/categories')}><T v="label" color={colors.gold} style={{ marginBottom: 12 }}>Room types & amenities</T></Pressable>
            {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No rooms yet" hint="Tap Add to create your first room." />}
        renderItem={({ item: r }) => (
          <Card style={{ marginBottom: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {imageUrl(r.primaryImage) ? <Img uri={imageUrl(r.primaryImage)!} style={{ width: 84, height: 84, borderRadius: 14 }} /> : <View style={{ width: 84, height: 84, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}><T v="small" color={colors.gold}>No photo</T></View>}
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <T v="small" style={{ fontWeight: '700' }}>Room {r.roomNumber} · Floor {r.floor}</T><Badge text={r.status} />
                </View>
                <T v="h3" numberOfLines={2}>{r.name}</T>
                <T v="small">{r.category.name} · {r.maxGuests} guests · {r.images.length} photos{r.avgRating ? ` · ★ ${r.avgRating.toFixed(1)}` : ''}</T>
                <T v="small" color={colors.navy} style={{ fontWeight: '700' }}>{money(r.pricePerNight)} / night</T>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button title="Edit" small variant="outline" icon={<Pencil size={14} color={colors.navy} />} style={{ flex: 1 }} onPress={() => router.push({ pathname: '/manage/room-form', params: { id: String(r.id) } })} />
              <Button title="Delete" small variant="danger" icon={<Trash2 size={14} color={colors.danger} />} style={{ flex: 1 }} onPress={() => remove(r)} />
            </View>
          </Card>
        )}
      />
    </KeyboardView>
    </SafeAreaView>
  );
}
