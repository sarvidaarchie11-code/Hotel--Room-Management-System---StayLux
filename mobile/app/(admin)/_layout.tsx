import { Stack } from 'expo-router';

export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />;
}
