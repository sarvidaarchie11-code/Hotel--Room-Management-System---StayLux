import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { ActivityFeed } from '@/components/ActivityFeed';
import { NotificationsBody } from '@/components/NotificationsList';
import { Segmented } from '@/components/Pickers';
import { Backdrop, T } from '@/components/ui';
import { useNotifications } from '@/contexts/NotificationContext';

/** Guest "Activity" tab: Updates = live notifications, History = the guest's own private activity log. */
export default function ActivityTab() {
  const { unread } = useNotifications();
  const [view, setView] = useState('updates');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <Backdrop />
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <T v="h1" style={{ marginBottom: 12 }}>Activity</T>
        <Segmented value={view} onChange={setView} options={[['updates', unread ? `Updates · ${unread}` : 'Updates'], ['history', 'History']]} />
      </View>
      {view === 'updates' ? <NotificationsBody showMarkAll /> : <ActivityFeed />}
    </SafeAreaView>
  );
}
