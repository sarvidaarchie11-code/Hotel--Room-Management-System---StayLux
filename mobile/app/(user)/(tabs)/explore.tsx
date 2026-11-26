import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ArrowUp, CalendarDays, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { colors, fontSizes, glass } from '@/constants/theme';
import { DateRangePicker } from '@/components/DateRangePicker';
import { FilterSheet } from '@/components/FilterSheet';
import { Segmented, SelectPill } from '@/components/Pickers';
import { RoomCard } from '@/components/RoomCard';
import { Backdrop, Button, EmptyState, ErrorBanner, Input, KeyboardView, Loading, T } from '@/components/ui';
import { useLoad } from '@/hooks/useLoad';
import { usePaged } from '@/hooks/usePaged';
import { api } from '@/services/api';
import { Category, Room } from '@/types';
import { money } from '@/utils/format';

type Dates = { ci: string | null; co: string | null };
const NO_DATES: Dates = { ci: null, co: null };
const GUEST_OPTIONS: [string, string][] = [['', 'Any'], ['2', '2+'], ['4', '4+'], ['6', '6+']];
const SORT_OPTIONS: [string, string][] = [['newest', 'Newest'], ['price_asc', 'Lowest price'], ['price_desc', 'Highest price']];

export default function Explore() {
  const params = useLocalSearchParams<{ search?: string; categoryId?: string }>();

  // applied filters (these drive the list)
  const [search, setSearch] = useState(params.search ?? '');
  const [categoryId, setCategoryId] = useState<string>(params.categoryId ?? '');
  const [guests, setGuests] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [dates, setDates] = useState<Dates>(NO_DATES);

  // draft filters (edited inside the sheet, committed with Apply)
  const [sheet, setSheet] = useState(false);
  const [dCat, setDCat] = useState('');
  const [dGuests, setDGuests] = useState('');
  const [dMin, setDMin] = useState('');
  const [dMax, setDMax] = useState('');
  const [dSort, setDSort] = useState('newest');
  const [dDates, setDDates] = useState<Dates>(NO_DATES);
  const [showCal, setShowCal] = useState(false);

  const [total, setTotal] = useState<number | null>(null);
  const [showTop, setShowTop] = useState(false);
  const listRef = useRef<FlatList<Room>>(null);

  // arriving from Home with a search term / category
  useEffect(() => { if (params.search !== undefined) setSearch(params.search); }, [params.search]);
  useEffect(() => { if (params.categoryId) setCategoryId(params.categoryId); }, [params.categoryId]);

  const query = useMemo(() => ({
    search: search.trim() || undefined, categoryId: categoryId || undefined, guests: guests || undefined, sort,
    minPrice: minPrice || undefined, maxPrice: maxPrice || undefined,
    checkIn: dates.ci && dates.co ? dates.ci : undefined, checkOut: dates.ci && dates.co ? dates.co : undefined,
  }), [search, categoryId, guests, sort, minPrice, maxPrice, dates]);

  const rooms = usePaged<Room>(async (page) => {
    const r = await api.get<{ rooms: Room[]; hasMore: boolean; total?: number }>('/rooms', { params: { ...query, page, pageSize: 10 } });
    if (typeof r.data.total === 'number') setTotal(r.data.total);
    return { items: r.data.rooms, hasMore: r.data.hasMore };
  }, ['room', 'booking']);
  const cats = useLoad(() => api.get<{ categories: Category[] }>('/categories').then((r) => r.data.categories), ['category'], 'explore-categories');

  const reload = rooms.reload;
  useEffect(() => { const t = setTimeout(() => { void reload(); }, 250); listRef.current?.scrollToOffset({ offset: 0, animated: false }); return () => clearTimeout(t); }, [query, reload]); // debounce typing; a new filter starts at the top

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => setShowTop(e.nativeEvent.contentOffset.y > 500), []);

  const catName = (id: string) => cats.data?.find((c) => String(c.id) === id)?.name ?? 'Room type';
  // one removable chip per applied filter (shown on a single line)
  const applied = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (categoryId) list.push({ key: 'cat', label: catName(categoryId), clear: () => setCategoryId('') });
    if (guests) list.push({ key: 'guests', label: `${guests}+ guests`, clear: () => setGuests('') });
    if (minPrice || maxPrice) list.push({ key: 'price', label: minPrice && maxPrice ? `${money(Number(minPrice))}–${money(Number(maxPrice))}` : minPrice ? `From ${money(Number(minPrice))}` : `Up to ${money(Number(maxPrice))}`, clear: () => { setMinPrice(''); setMaxPrice(''); } });
    if (dates.ci && dates.co) list.push({ key: 'dates', label: `${format(parseISO(dates.ci), 'MMM d')} – ${format(parseISO(dates.co), 'MMM d')}`, clear: () => setDates(NO_DATES) });
    if (sort !== 'newest') list.push({ key: 'sort', label: SORT_OPTIONS.find(([k]) => k === sort)?.[1] ?? 'Sorted', clear: () => setSort('newest') });
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, guests, minPrice, maxPrice, dates, sort, cats.data]);

  const openSheet = () => { setDCat(categoryId); setDGuests(guests); setDMin(minPrice); setDMax(maxPrice); setDSort(sort); setDDates(dates); setShowCal(false); setSheet(true); };
  const apply = () => { setCategoryId(dCat); setGuests(dGuests); setMinPrice(dMin); setMaxPrice(dMax); setSort(dSort); setDates(dDates); setSheet(false); };
  const resetDraft = () => { setDCat(''); setDGuests(''); setDMin(''); setDMax(''); setDSort('newest'); setDDates(NO_DATES); setShowCal(false); };
  const clearAll = () => { setCategoryId(''); setGuests(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); setDates(NO_DATES); setSearch(''); };

  const shown = applied.slice(0, 3);
  const header = (
    <View style={{ paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <T v="h1">Explore</T>
        {total !== null ? <T v="small">{total} {total === 1 ? 'room' : 'rooms'}</T> : null}
      </View>
      <Input value={search} onChangeText={setSearch} placeholder="Search by name, type or feature" returnKeyType="search" onSubmitEditing={() => void reload()} icon={<Search size={18} color={colors.muted} />}
        right={
          <Pressable onPress={openSheet} hitSlop={10} accessibilityLabel="Open filters">
            <View>
              <SlidersHorizontal size={20} color={colors.navy} />
              {applied.length ? <View style={{ position: 'absolute', top: -6, right: -8, backgroundColor: colors.gold, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}><T v="small" color={colors.white} style={{ fontSize: fontSizes.micro, fontWeight: '800' }}>{applied.length}</T></View> : null}
            </View>
          </Pressable>
        } />
      {applied.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {shown.map((f) => (
            <Pressable key={f.key} onPress={f.clear} accessibilityLabel={`Remove filter ${f.label}`} style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: glass.strong, borderWidth: 1, borderColor: glass.edge, borderRadius: 999, paddingVertical: 6, paddingLeft: 12, paddingRight: 8 }}>
              <T v="small" color={colors.navy} numberOfLines={1} style={{ fontWeight: '700', flexShrink: 1 }}>{f.label}</T>
              <X size={13} color={colors.muted} />
            </Pressable>
          ))}
          {applied.length > 3 ? <Pressable onPress={openSheet}><T v="label" color={colors.gold}>+{applied.length - 3}</T></Pressable> : null}
        </View>
      ) : null}
      {rooms.error ? <ErrorBanner message={rooms.error} onRetry={reload} /> : null}
    </View>
  );

  const empty = rooms.loading ? <Loading /> : (
    <EmptyState
      title="No rooms match"
      hint={applied.length || search.trim() ? 'Nothing fits the current search and filters.' : 'Rooms will appear here once the hotel adds them.'}
      action={applied.length || search.trim() ? <Button title="Clear filters" variant="outline" small onPress={clearAll} /> : undefined}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <KeyboardView>
        <FlatList
          ref={listRef}
          keyboardShouldPersistTaps="handled"
          data={rooms.items}
          keyExtractor={(r) => String(r.id)}
          renderItem={({ item, index }) => <RoomCard room={item} index={index} />}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshing={rooms.refreshing}
          onRefresh={rooms.onRefresh}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={rooms.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
  rooms.loadingMore ? <Loading compact /> : undefined
}
        />
      </KeyboardView>
      {showTop ? (
        <Pressable onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} accessibilityLabel="Back to top" style={{ position: 'absolute', right: 20, bottom: 24, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUp color={colors.gold} size={20} />
        </Pressable>
      ) : null}

      <FilterSheet
        visible={sheet}
        title="Filters"
        onClose={() => setSheet(false)}
        footer={<><Button title="Reset" variant="outline" onPress={resetDraft} style={{ flex: 1 }} /><Button title="Apply" variant="gold" onPress={apply} style={{ flex: 2 }} /></>}
      >
        <SelectPill label="Room type" title="Room type" value={dCat} onChange={setDCat} options={[['', 'All room types'], ...((cats.data ?? []).map((c) => [String(c.id), c.name] as [string, string]))]} />
        <T v="label" color={colors.ink} style={{ marginBottom: 6 }}>Guests</T>
        <Segmented options={GUEST_OPTIONS} value={dGuests} onChange={setDGuests} />
        <T v="label" color={colors.ink} style={{ marginBottom: 6 }}>Price per night</T>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input value={dMin} onChangeText={setDMin} placeholder="Min" filter="digits" /></View>
          <View style={{ flex: 1 }}><Input value={dMax} onChangeText={setDMax} placeholder="Max" filter="digits" /></View>
        </View>
        <T v="label" color={colors.ink} style={{ marginBottom: 6 }}>Sort by</T>
        <Segmented options={SORT_OPTIONS} value={dSort} onChange={setDSort} />
        <T v="label" color={colors.ink} style={{ marginBottom: 6 }}>Available between</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Button title={dDates.ci && dDates.co ? `${format(parseISO(dDates.ci), 'MMM d')} – ${format(parseISO(dDates.co), 'MMM d')}` : 'Choose dates'} variant="outline" small icon={<CalendarDays size={16} color={colors.navy} />} onPress={() => setShowCal(!showCal)} style={{ flex: 1 }} />
          {dDates.ci ? <Button title="Clear" variant="ghost" small onPress={() => setDDates(NO_DATES)} /> : null}
        </View>
        {showCal ? <DateRangePicker checkIn={dDates.ci} checkOut={dDates.co} blocked={[]} onChange={(ci, co) => setDDates({ ci, co })} /> : null}
      </FilterSheet>
    </SafeAreaView>
  );
}
