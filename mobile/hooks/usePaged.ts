import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errMsg } from '@/services/api';
import { useLiveRefresh } from './useLiveRefresh';

interface Page<T> { items: T[]; hasMore: boolean }

/** Infinite list: page 1 on focus / pull-to-refresh / live events, next pages via loadMore (onEndReached). */
export function usePaged<T>(fetchPage: (page: number) => Promise<Page<T>>, live: string[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const page = useRef(1);
  const hasMore = useRef(false);
  const busy = useRef(false);

  const reload = useCallback(async () => {
    try {
      const r = await fetchRef.current(1);
      page.current = 1; hasMore.current = r.hasMore;
      setItems(r.items); setError(null);
    } catch (e) { setError(errMsg(e)); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore.current) return;
    busy.current = true; setLoadingMore(true);
    try {
      const next = page.current + 1;
      const r = await fetchRef.current(next);
      page.current = next; hasMore.current = r.hasMore;
      setItems((prev) => [...prev, ...r.items]);
    } catch (e) { setError(errMsg(e)); } finally { busy.current = false; setLoadingMore(false); }
  }, []);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  useLiveRefresh(live, () => { void reload(); });
  const onRefresh = useCallback(() => { setRefreshing(true); void reload(); }, [reload]);

  return { items, loading, refreshing, loadingMore, error, reload, loadMore, onRefresh };
}
