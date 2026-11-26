import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound, Search } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { Img } from '@/components/Img';
import { SortControl } from '@/components/SortControl';
import { Button, Card, EmptyState, ErrorBanner, Header, Input, Loading, T, KeyboardView, ChipRow, Backdrop } from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { api, errMsg } from '@/services/api';
import { day } from '@/utils/format';

interface Guest { id: number; fullName: string; email: string; phone: string; isActive: boolean; createdAt: string; avatarPath?: string | null; _count: { bookings: number } }

export default function Users() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const { items, loading, error, refreshing, onRefresh, reload, loadMore, loadingMore } = usePaged<Guest>(async (page) => {
    const r = await api.get<{ users: Guest[]; hasMore: boolean }>('/admin/users', { params: { search: search.trim() || undefined, sort, page, pageSize: 15 } });
    return { items: r.data.users, hasMore: r.data.hasMore };
  }, ['user', 'booking']);
  useEffect(() => { const t = setTimeout(() => { void reload(); }, 250); return () => clearTimeout(t); }, [search, sort, reload]);

  const toggle = async (u: Guest, isActive: boolean) => {
    try { await api.patch(`/admin/users/${u.id}/active`, { isActive }); await reload(); } catch (e) { Alert.alert('Failed', errMsg(e)); }
  };
  const resetPassword = (u: Guest) => Alert.alert('Reset password?', `Create a temporary password for ${u.fullName}. They must change it at next login. Only do this after confirming it is really them.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', style: 'destructive', onPress: async () => {
      try {
        const { data } = await api.post<{ temporaryPassword: string }>(`/admin/users/${u.id}/reset-password`);
        Alert.alert('Temporary password', `${data.temporaryPassword}\n\nGive this to ${u.fullName}. It is shown only once.`);
      } catch (e) { Alert.alert('Failed', errMsg(e)); }
    } },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <KeyboardView>
      <Header title="Guests" right={<SortControl value={sort} onChange={setSort} options={[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['name', 'Name A to Z']]} />} />
      <FlatList
        data={items}
        keyExtractor={(u) => String(u.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
  loadingMore ? <Loading compact /> : undefined
}
        contentContainerStyle={{ padding: 20, paddingTop: 6 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Input value={search} onChangeText={setSearch} placeholder="Search name or email" icon={<Search size={18} color={colors.muted} />} />
            {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState title="No guests found" hint="Registered guests appear here." />}
        renderItem={({ item: u }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {imageUrl(u.avatarPath) ? <Img uri={imageUrl(u.avatarPath)!} style={{ width: 46, height: 46 }} /> : <T v="h3" color={colors.gold}>{u.fullName[0]?.toUpperCase()}</T>}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="h3">{u.fullName}</T>
                <T v="small">{u.email} · {u.phone}</T>
                <T v="small">Joined {day(u.createdAt)} · {u._count.bookings} booking(s)</T>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Switch value={u.isActive} onValueChange={(v) => toggle(u, v)} trackColor={{ true: colors.sage, false: colors.line }} thumbColor={colors.white} />
                <T v="small">{u.isActive ? 'Active' : 'Blocked'}</T>
              </View>
            </View>
            <Button title="Reset Password" small variant="outline" icon={<KeyRound size={14} color={colors.navy} />} onPress={() => resetPassword(u)} style={{ marginTop: 10 }} />
          </Card>
        )}
      />
    </KeyboardView>
    </SafeAreaView>
  );
}
