
import React, { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Lock, Mail, Phone, User } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import {
  Backdrop,
  Button,
  Card,
  ErrorBanner,
  Input,
  KeyboardView,
  T,
} from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { errMsg, fieldErrors } from '@/services/api';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [f, setF] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refs = {
    email: useRef<React.ElementRef<typeof TextInput>>(null),
    phone: useRef<React.ElementRef<typeof TextInput>>(null),
    password: useRef<React.ElementRef<typeof TextInput>>(null),
    confirm: useRef<React.ElementRef<typeof TextInput>>(null),
  };

  const set = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (f.fullName.trim().length < 2) {
      e.fullName = 'Full name is required';
    }

    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      e.email = 'Enter a valid email address';
    }

    if (!/^[+0-9\s-]{7,20}$/.test(f.phone.trim())) {
      e.phone = 'Enter a valid phone number';
    }

    if (f.password.length < 8) {
      e.password = 'At least 8 characters';
    } else if (
      !/[a-z]/.test(f.password) ||
      !/[A-Z]/.test(f.password) ||
      !/[0-9]/.test(f.password)
    ) {
      e.password = 'Use upper and lower case letters and a number';
    }

    if (f.confirmPassword !== f.password) {
      e.confirmPassword = 'Passwords do not match';
    }

    return e;
  };

  const submit = async () => {
    const e = validate();

    setErrors(e);

    if (Object.keys(e).length) return;

    setBusy(true);
    setError('');

    try {
      await register({
        ...f,
        fullName: f.fullName.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(),
      });

      router.replace('/');
    } catch (err) {
      setError(errMsg(err));
      setErrors(fieldErrors(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <Backdrop />

      <KeyboardView>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 22 }}>
            <LogoMark size={60} color={colors.navy} />

            <T v="h1" style={{ marginTop: 12 }}>
              Create your account
            </T>

            <T v="small" style={{ marginTop: 2, textAlign: 'center' }}>
              Book rooms, track reservations and get updates.
            </T>
          </View>

          <Card style={{ padding: 22, borderRadius: 28 }}>
            {error ? <ErrorBanner message={error} /> : null}

            <Input
              filter="letters"
              label="Full name"
              value={f.fullName}
              onChangeText={set('fullName')}
              placeholder="Juan Dela Cruz"
              returnKeyType="next"
              onSubmitEditing={() => refs.email.current?.focus()}
              error={errors.fullName}
              icon={<User size={18} color={colors.muted} />}
            />

            <Input
              ref={refs.email}
              label="Email address"
              value={f.email}
              onChangeText={set('email')}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => refs.phone.current?.focus()}
              error={errors.email}
              icon={<Mail size={18} color={colors.muted} />}
            />

            <Input
              ref={refs.phone}
              filter="phone"
              label="Phone number"
              value={f.phone}
              onChangeText={set('phone')}
              placeholder="+63 912 345 6789"
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => refs.password.current?.focus()}
              error={errors.phone}
              icon={<Phone size={18} color={colors.muted} />}
            />

            <Input
              ref={refs.password}
              label="Password"
              value={f.password}
              onChangeText={set('password')}
              placeholder="8+ characters, Aa and a number"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => refs.confirm.current?.focus()}
              error={errors.password}
              icon={<Lock size={18} color={colors.muted} />}
            />

            <Input
              ref={refs.confirm}
              label="Confirm password"
              value={f.confirmPassword}
              onChangeText={set('confirmPassword')}
              placeholder="Repeat password"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={errors.confirmPassword}
              icon={<Lock size={18} color={colors.muted} />}
            />

            <Button
              title="Create Account"
              onPress={submit}
              loading={busy}
              style={{ marginTop: 4 }}
            />
          </Card>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              marginTop: 22,
            }}
          >
            <T v="small">Already have an account?</T>

            <Link href="/login">
              <T v="label" color={colors.gold}>
                Sign in
              </T>
            </Link>
          </View>
        </ScrollView>
      </KeyboardView>
    </View>
  );
}
