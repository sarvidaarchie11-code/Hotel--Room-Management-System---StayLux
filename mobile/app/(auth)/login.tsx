
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { colors, fontSizes } from '@/constants/theme';
import {Backdrop,
  Button,
  Card,
  ErrorBanner,
  FadeIn,
  Input,
  KeyboardView,
  T,
} from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { errMsg, fieldErrors } from '@/services/api';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const submit = async () => {
    const e: Record<string, string> = {};

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      e.email = 'Enter a valid email address';
    }

    if (!password) {
      e.password = 'Enter your password';
    }

    setErrors(e);

    if (Object.keys(e).length) return;

    setBusy(true);
    setError('');

    try {
      await login(email.trim().toLowerCase(), password);
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
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeIn
            rise={16}
            duration={500}
            style={{ alignItems: 'center', marginBottom: 28 }}
          >
            <LogoMark size={78} color={colors.navy} />

            <T
              v="display"
              style={{
                marginTop: 14,
                letterSpacing: 7,
                fontSize: fontSizes.brand,
              }}
            >
              STAYLUX
            </T>

            <T v="small" style={{ marginTop: 4 }}>
              Quiet luxury, by the sea
            </T>
          </FadeIn>

          <FadeIn delay={180} duration={500}>
            <Card style={{ padding: 22, borderRadius: 28 }}>
              <T v="h1">Welcome back</T>

              <T v="small" style={{ marginTop: 2, marginBottom: 20 }}>
                Sign in to manage your stay or the hotel.
              </T>

              {error ? <ErrorBanner message={error} /> : null}

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                error={errors.email}
                icon={<Mail size={18} color={colors.muted} />}
              />

              <Input
                ref={passRef}
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry={!show}
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={errors.password}
                icon={<Lock size={18} color={colors.muted} />}
                right={
                  <Pressable
                    onPress={() => setShow(!show)}
                    hitSlop={10}
                    accessibilityLabel={
                      show ? 'Hide password' : 'Show password'
                    }
                  >
                    {show ? (
                      <EyeOff size={18} color={colors.muted} />
                    ) : (
                      <Eye size={18} color={colors.muted} />
                    )}
                  </Pressable>
                }
              />

              <Link
                href="/forgot-password"
                style={{ alignSelf: 'flex-end', marginBottom: 16 }}
              >
                <T v="label">Forgot password?</T>
              </Link>

              <Button
                title="Sign In"
                onPress={submit}
                loading={busy}
              />
            </Card>
          </FadeIn>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              marginTop: 22,
            }}
          >
            <T v="small">New guest?</T>

            <Link href="/register">
              <T v="label" color={colors.gold}>
                Create an account
              </T>
            </Link>
          </View>
        </ScrollView>
      </KeyboardView>
    </View>
  );
}
