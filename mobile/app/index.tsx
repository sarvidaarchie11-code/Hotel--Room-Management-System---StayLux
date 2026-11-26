import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasSeenWelcome } from '@/constants/session';

export default function Index() {
  const { user } = useAuth();
  if (!user) return <Redirect href={hasSeenWelcome() ? '/login' : '/welcome'} />;
  if (user.mustChangePassword) return <Redirect href="/account/change-password" />;
  return <Redirect href={user.role === 'ADMIN' ? '/dashboard' : '/home'} />;
}
