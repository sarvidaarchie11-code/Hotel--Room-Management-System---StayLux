import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { REQUIRE_LOGIN_ON_START } from '@/constants/config';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { User } from '@/types';

const TOKEN_KEY = 'hotel_jwt';

export interface RegisterInput { fullName: string; email: string; phone: string; password: string; confirmPassword: string }

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const startSession = useCallback(async (token: string, u: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    connectSocket(token);
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    disconnectSocket();
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    setUserState(null); // LOGOUT EVENT: guarded routes react to this and return to the login screen
  }, []);

  // Restore the persisted session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (REQUIRE_LOGIN_ON_START) {
          // every launch starts at the login screen: forget any previous session
          if (token) await SecureStore.deleteItemAsync(TOKEN_KEY);
          return;
        }
        if (token) {
          setAuthToken(token);
          const { data } = await api.get<{ user: User }>('/auth/me');
          connectSocket(token);
          setUserState(data.user);
        }
      } catch {
        setAuthToken(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { void logout(); });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    await startSession(data.token, data.user);
    return data.user;
  }, [startSession]);

  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/register', input);
    await startSession(data.token, data.user);
    return data.user;
  }, [startSession]);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser: setUserState }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
