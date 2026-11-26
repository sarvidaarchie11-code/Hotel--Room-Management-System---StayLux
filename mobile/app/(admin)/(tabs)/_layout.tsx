import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { BedDouble, CalendarCheck, CreditCard, LayoutDashboard, Menu } from 'lucide-react-native';
import { GlassNav, NavItem } from '@/components/GlassNav';
import { colors } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationContext';

export default function AdminTabs() {
  const { unread } = useNotifications();
  const items: NavItem[] = [
    { name: 'dashboard', title: 'Dashboard', Icon: LayoutDashboard },
    { name: 'rooms', title: 'Rooms', Icon: BedDouble },
    { name: 'reservations', title: 'Bookings', Icon: CalendarCheck },
    { name: 'payments', title: 'Payments', Icon: CreditCard },
    { name: 'more', title: 'More', Icon: Menu, badge: unread },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false, animation: 'fade', lazy: false, sceneStyle: { backgroundColor: colors.ivory } }}>
        {items.map((i) => <Tabs.Screen key={i.name} name={i.name} options={{ title: i.title }} />)}
      </Tabs>
      <GlassNav items={items} />
    </View>
  );
}
