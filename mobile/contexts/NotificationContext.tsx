import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { AppState } from 'react-native';
import { api } from '@/services/api';
import { onNotification } from '@/services/socket';
import { setupNotifications, showLocalNotification } from '@/services/localNotifications';
import { AppNotification } from '@/types';
import { useAuth } from './AuthContext';

interface State { items: AppNotification[]; unread: number }
type Action =
  | { type: 'set'; items: AppNotification[]; unread: number }
  | { type: 'add'; item: AppNotification }
  | { type: 'read'; id: number }
  | { type: 'readAll' }
  | { type: 'clear' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set': return { items: action.items, unread: action.unread };
    case 'add':
      if (state.items.some((n) => n.id === action.item.id)) return state;
      return { items: [action.item, ...state.items], unread: state.unread + 1 };
    case 'read': {
      const target = state.items.find((n) => n.id === action.id);
      if (!target || target.read) return state;
      return { items: state.items.map((n) => (n.id === action.id ? { ...n, read: true } : n)), unread: Math.max(0, state.unread - 1) };
    }
    case 'readAll': return { items: state.items.map((n) => ({ ...n, read: true })), unread: 0 };
    case 'clear': return { items: [], unread: 0 };
  }
}

interface Value extends State {
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}
const Ctx = createContext<Value | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { items: [], unread: 0 });

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ notifications: AppNotification[]; unread: number }>('/notifications');
      dispatch({ type: 'set', items: data.notifications, unread: data.unread });
    } catch { /* offline - keep what we have */ }
  }, []);

  useEffect(() => {
    if (!user || user.mustChangePassword) { dispatch({ type: 'clear' }); return; }
    void setupNotifications();
    void refresh();
    // NOTIFICATION EVENT: the server pushes each new notification over the socket
    const off = onNotification((n) => {
      dispatch({ type: 'add', item: n });
      void showLocalNotification(n.title, n.body);
    });
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void refresh(); });
    return () => { off(); sub.remove(); };
  }, [user, refresh]);

  const markRead = useCallback(async (id: number) => {
    dispatch({ type: 'read', id });
    await api.patch(`/notifications/${id}/read`).catch(() => undefined);
  }, []);
  const markAllRead = useCallback(async () => {
    dispatch({ type: 'readAll' });
    await api.post('/notifications/read-all').catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ ...state, refresh, markRead, markAllRead }), [state, refresh, markRead, markAllRead]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNotifications must be used inside NotificationProvider');
  return v;
}
