import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Activity, CalendarDays, Compass, Home, User } from 'lucide-react-native';
import { GlassNav, NavItem } from '@/components/GlassNav';
import { colors } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationContext';

export default function UserTabs() {
  const { unread } = useNotifications();
  const items: NavItem[] = [
    { name: 'home', title: 'Home', Icon: Home },
    { name: 'explore', title: 'Explore', Icon: Compass },
    { name: 'bookings', title: 'Bookings', Icon: CalendarDays },
    { name: 'notifications', title: 'Activity', Icon: Activity, badge: unread },
    { name: 'profile', title: 'Profile', Icon: User },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      {/* the navigator keeps the screens; its own bar is hidden because GlassNav is the bar */}
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false, animation: 'fade', lazy: false, sceneStyle: { backgroundColor: colors.ivory } }}>
        {items.map((i) => <Tabs.Screen key={i.name} name={i.name} options={{ title: i.title }} />)}
      </Tabs>
      <GlassNav items={items} />
    </View>
  );
}
