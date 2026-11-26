import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ToastProvider } from '@/components/Toast';
import { colors } from '@/constants/theme';

void SplashScreen.preventAutoHideAsync();

function Guards() {
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading) void SplashScreen.hideAsync(); }, [loading]);
  if (loading) return null;

  // Role-based route protection on the device. (The API enforces the same rules independently.)
  const ready = !!user && !user.mustChangePassword;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right', contentStyle: { backgroundColor: colors.ivory } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={ready && user?.role === 'USER'}>
        <Stack.Screen name="(user)" />
      </Stack.Protected>
      <Stack.Protected guard={ready && user?.role === 'ADMIN'}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="account" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <FavoritesProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <Guards />
          </ToastProvider>
        </FavoritesProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
