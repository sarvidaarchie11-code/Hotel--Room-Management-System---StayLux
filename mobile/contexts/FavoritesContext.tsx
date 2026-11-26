import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

interface Value { isFav: (roomId: number) => boolean; toggle: (roomId: number) => Promise<void>; count: number }
const Ctx = createContext<Value | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    if (user?.role !== 'USER' || user.mustChangePassword) { setIds([]); return; }
    api.get<{ ids: number[] }>('/favorites').then((r) => setIds(r.data.ids)).catch(() => undefined);
  }, [user]);

  const toggle = useCallback(async (roomId: number) => {
    setIds((p) => (p.includes(roomId) ? p.filter((x) => x !== roomId) : [roomId, ...p])); // optimistic: heart reacts instantly
    try { await api.post(`/favorites/${roomId}`); } catch {
      setIds((p) => (p.includes(roomId) ? p.filter((x) => x !== roomId) : [roomId, ...p])); // roll back
    }
  }, []);

  const value = useMemo(() => ({ isFav: (id: number) => ids.includes(id), toggle, count: ids.length }), [ids, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFavorites must be used inside FavoritesProvider');
  return v;
}
