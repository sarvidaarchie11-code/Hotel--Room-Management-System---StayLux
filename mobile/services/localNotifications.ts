import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

let ready = false;

export async function setupNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Hotel updates', importance: Notifications.AndroidImportance.HIGH });
    }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    ready = granted;
  } catch {
    ready = false; // notifications unsupported here - history in the app still works
  }
}

/** Shows a device notification when a server event arrives. (Remote push is not used - see README.) */
export async function showLocalNotification(title: string, body: string): Promise<void> {
  if (!ready) return;
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch { /* ignore */ }
}
