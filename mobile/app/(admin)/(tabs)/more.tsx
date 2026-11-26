import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart3, Bell, CalendarRange, ChevronRight, Hotel, Layers, Tag, Users } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ProfileMenu } from '@/components/ProfileMenu';
import { Card, Screen, T } from '@/components/ui';
import { useNotifications } from '@/contexts/NotificationContext';

export default function More() {
  const router = useRouter();
  const { unread } = useNotifications();
  const groups = [
    { title: 'Operations', items: [
      { icon: CalendarRange, label: 'Occupancy calendar', path: '/manage/calendar' },
      { icon: Users, label: 'Guests', path: '/manage/users' },
      { icon: BarChart3, label: 'Reports', path: '/manage/reports' },
    ] },
    { title: 'Hotel', items: [
      { icon: Tag, label: 'Special offers', path: '/manage/offers' },
      { icon: Layers, label: 'Room types & amenities', path: '/manage/categories' },
      { icon: Hotel, label: 'Hotel settings', path: '/manage/hotel-settings' },
    ] },
    { title: 'Inbox', items: [
      { icon: Bell, label: unread ? `Notifications (${unread} new)` : 'Notifications', path: '/manage/notifications' },
    ] },
  ];
  return (
    <Screen>
      <T v="h1" style={{ marginBottom: 16 }}>More</T>
      {groups.map((g) => (
        <View key={g.title} style={{ marginBottom: 6 }}>
          <T v="small" style={{ fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, marginTop: 10 }}>{g.title.toUpperCase()}</T>
          <Card style={{ padding: 4 }}>
            {g.items.map(({ icon: Icon, label, path }) => (
              <Pressable key={path} onPress={() => router.push(path as never)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: pressed ? 0.6 : 1 })}>
                <Icon size={20} color={colors.sage} /><T v="h3" style={{ flex: 1 }}>{label}</T><ChevronRight size={18} color={colors.muted} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
      <T v="small" style={{ fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, marginTop: 16 }}>ACCOUNT</T>
      <ProfileMenu />
    </Screen>
  );
}
