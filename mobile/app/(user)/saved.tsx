import React from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { RoomCard } from '@/components/RoomCard';
import { Button, EmptyState, ErrorBanner, Header, Loading, Backdrop } from '@/components/ui';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLoad } from '@/hooks/useLoad';
import { api } from '@/services/api';
import { Room } from '@/types';

export default function Saved() {
  const router = useRouter();
  const { count } = useFavorites(); // reloads the list whenever a heart is toggled
  const { data, loading, error, refreshing, onRefresh, reload } = useLoad(() => api.get<{ rooms: Room[] }>('/favorites').then((r) => r.data.rooms), ['room'], `saved-${count}`);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <Header title="Saved rooms" />
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={data ?? []}
        keyExtractor={(r) => String(r.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ padding: 20, paddingTop: 6 }}
        ListHeaderComponent={
  error ? <ErrorBanner message={error} onRetry={reload} /> : undefined
}
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No saved rooms yet" hint="Tap the heart on a room to save it here." action={<Button title="Browse rooms" variant="gold" onPress={() => router.push('/explore')} />} />}
        renderItem={({ item, index }) => <RoomCard room={item} index={index} />}
      />
    </SafeAreaView>
  );
}
