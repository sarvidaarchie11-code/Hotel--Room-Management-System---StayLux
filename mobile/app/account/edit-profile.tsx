import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ErrorBanner, Header, Input, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { api, errMsg, fieldErrors } from '@/services/api';
import { User } from '@/types';

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => { // PROFILE UPDATE event
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = 'Full name is required';
    if (!/^[+0-9\s-]{7,20}$/.test(phone.trim())) e.phone = 'Enter a valid phone number';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.put<{ user: User }>('/auth/profile', { fullName, phone });
      setUser(data.user);
      toast.show('Profile updated'); router.back();
    } catch (err) { setError(errMsg(err)); setErrors(fieldErrors(err)); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Header title="Edit profile" />
      {error ? <ErrorBanner message={error} /> : null}
      <Input filter="letters" label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
      <Input label="Email (read-only)" value={user?.email ?? ''} editable={false} />
      <Input filter="phone" label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} onSubmitEditing={save} returnKeyType="done" />
      <Button title="Save Changes" onPress={save} loading={busy} variant="gold" />
    </Screen>
  );
}
