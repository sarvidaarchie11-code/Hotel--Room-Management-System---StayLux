import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ErrorBanner, Header, Input, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { api, errMsg, fieldErrors } from '@/services/api';
import { User } from '@/types';

export default function ChangePassword() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const forced = !!user?.mustChangePassword;
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!f.currentPassword) e.currentPassword = 'Enter your current password';
    if (f.newPassword.length < 8 || !/[a-z]/.test(f.newPassword) || !/[A-Z]/.test(f.newPassword) || !/[0-9]/.test(f.newPassword)) e.newPassword = 'Min. 8 characters with upper, lower case and a number';
    if (f.confirmPassword !== f.newPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post<{ user: User }>('/auth/change-password', f);
      setUser(data.user);
      toast.show('Password updated'); router.replace('/');
    } catch (err) {
      setError(errMsg(err)); setErrors(fieldErrors(err));
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Header title={forced ? 'Set a new password' : 'Change password'} back={!forced} />
      {forced ? (
        <View style={{ backgroundColor: colors.goldSoft, borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <T v="small" color={colors.navy}>For security, set a new password before you continue.</T>
        </View>
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}
      <Input label="Current password" value={f.currentPassword} onChangeText={set('currentPassword')} secureTextEntry autoCapitalize="none" error={errors.currentPassword} />
      <Input label="New password" value={f.newPassword} onChangeText={set('newPassword')} secureTextEntry autoCapitalize="none" error={errors.newPassword} />
      <Input label="Confirm new password" value={f.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry autoCapitalize="none" error={errors.confirmPassword} onSubmitEditing={submit} returnKeyType="go" />
      <Button title="Update Password" onPress={submit} loading={busy} variant="gold" />
      {forced ? <Button title="Log out" variant="ghost" onPress={() => void logout()} style={{ marginTop: 10 }} /> : null}
    </Screen>
  );
}
