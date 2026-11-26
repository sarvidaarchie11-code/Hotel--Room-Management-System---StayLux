import React, { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, CalendarCheck, CreditCard, UserPlus } from 'lucide-react-native';
import { colors, glass, glassShadow } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppNotification } from '@/types';
import { stamp } from '@/utils/format';
import { Backdrop, Button, EmptyState, Header, Reveal, T } from './ui';

const iconFor = (type: string) => {
  if (type.startsWith('PAYMENT')) return CreditCard;
  if (type === 'USER_REGISTERED') return UserPlus;
  if (type.startsWith('BOOKING') || type.includes('CHECK')) return CalendarCheck;
  return Bell;
};

/** The notification list itself (no header), so it can sit under a tab switcher or a page header. */
export function NotificationsBody({ showMarkAll }: { showMarkAll?: boolean }) {
  const { items, unread, markRead, markAllRead, refresh } = useNotifications();
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const open = useCallback(async (n: AppNotification) => {
    await markRead(n.id);
    const data = n.data ? (JSON.parse(n.data) as { bookingId?: number }) : {};
    if (n.type === 'PASSWORD_RESET_REQUEST') { router.push('/manage/users'); return; }
    if (data.bookingId) {
      if (user?.role === 'ADMIN') router.push({ pathname: '/manage/booking/[id]', params: { id: String(data.bookingId) } });
      else router.push({ pathname: '/booking/[id]', params: { id: String(data.bookingId) } });
    }
  }, [markRead, router, user?.role]);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={items}
      keyExtractor={(n) => String(n.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}
      ListHeaderComponent={
  showMarkAll && unread ? (
    <View style={{ alignItems: 'flex-end', marginBottom: 6 }}>
      <Button
        title="Mark all as read"
        variant="ghost"
        small
        onPress={markAllRead}
      />
    </View>
  ) : undefined
}
      ListEmptyComponent={<EmptyState title="Nothing new" hint="Booking and payment updates will appear here." />}
      renderItem={({ item, index }) => {
        const Icon = iconFor(item.type);
        return (
          <Reveal index={index}>
            <Pressable onPress={() => open(item)} style={({ pressed }) => [{ flexDirection: 'row', gap: 12, backgroundColor: item.read ? glass.fill : colors.goldSoft, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: glass.edge, ...glassShadow }, pressed && { transform: [{ scale: 0.985 }] }]}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={colors.gold} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="h3">{item.title}</T>
                <T v="body">{item.body}</T>
                <T v="small">{stamp(item.createdAt)}</T>
              </View>
            </Pressable>
          </Reveal>
        );
      }}
    />
  );
}

/** Full notifications page (used by the admin). */
export function NotificationsList({ back }: { back?: boolean }) {
  const { unread, markAllRead } = useNotifications();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <Header title="Notifications" back={back} right={unread ? <Button title="Mark all as read" variant="ghost" small onPress={markAllRead} /> : undefined} />
      <NotificationsBody />
    </SafeAreaView>
  );
}
