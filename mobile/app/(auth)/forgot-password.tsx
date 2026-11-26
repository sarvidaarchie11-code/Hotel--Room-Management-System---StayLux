import React, { useState } from 'react';
import { View } from 'react-native';
import { Mail } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Button, ErrorBanner, Header, Input, Screen, T } from '@/components/ui';
import { api, errMsg } from '@/services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address');
    setBusy(true); setError('');
    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setDone(data.message);
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Header title="Forgot password" />
      <T v="body" style={{ marginBottom: 16 }}>Enter your account email. The hotel verifies it is you and gives you a temporary password to sign in with.</T>
      {error ? <ErrorBanner message={error} /> : null}
      {done ? (
        <View style={{ backgroundColor: colors.sageSoft, borderRadius: 16, padding: 16 }}><T v="body" color={colors.sage}>{done}</T></View>
      ) : (
        <>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" returnKeyType="send" onSubmitEditing={submit} icon={<Mail size={18} color={colors.muted} />} />
          <Button title="Request Reset" variant="gold" onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}
