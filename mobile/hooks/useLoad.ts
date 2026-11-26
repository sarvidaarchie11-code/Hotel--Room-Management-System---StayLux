import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errMsg } from '@/services/api';
import { useLiveRefresh } from './useLiveRefresh';

const cache = new Map<string, unknown>(); // stale-while-revalidate: reopening a screen shows the last data instantly

/** Loads data on focus, on pull-to-refresh (onRefresh) and whenever a live server event touches `live`. */
export function useLoad<T>(fetcher: () => Promise<T>, live: string[] = [], cacheKey?: string) {
  const cached = cacheKey ? (cache.get(cacheKey) as T | undefined) : undefined;
  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      const d = await fetchRef.current();
      if (cacheKey) cache.set(cacheKey, d);
      setData(d);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useLiveRefresh(live, () => { void load(); });
  const onRefresh = useCallback(() => { setRefreshing(true); void load(); }, [load]);

  return { data, setData, loading, refreshing, error, reload: load, onRefresh };
}
