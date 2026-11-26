import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { colors, fontSizes, overlay } from '@/constants/theme';
import { markWelcomeSeen } from '@/constants/session';
import { LogoMark } from '@/components/Logo';
import { Button, FadeIn, Glow, T } from '@/components/ui';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/** First screen of every launch: the logo pops in, the name and tagline fade up, then the actions slide in. */
export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = useRef(pop.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })).current;
  const ringScale = useRef(pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] })).current;
  const ringOpacity = useRef(pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.08] })).current;

  useEffect(() => {
    markWelcomeSeen();
    if (reduce) { pop.setValue(1); return; }
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 7, bounciness: 11 }).start();
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pop, pulse, reduce]);

  // light status-bar icons on the dark screen
  useFocusEffect(useCallback(() => { setStatusBarStyle('light'); return () => setStatusBarStyle('dark'); }, []));

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, overflow: 'hidden' }}>
      <Glow size={520} rgb="184,119,92" a={0.05} style={{ top: -200, right: -200 }} />
      <Glow size={560} rgb="95,120,200" a={0.06} style={{ bottom: -240, left: -230 }} />
      <Glow size={300} rgb="110,190,200" a={0.035} style={{ top: 260, left: -150 }} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, paddingHorizontal: 32 }}>
        <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1.5, borderColor: colors.gold, opacity: ringOpacity, transform: [{ scale: ringScale }] }} />
          <Animated.View style={{ opacity: pop, transform: [{ scale }] }}><LogoMark size={116} color={colors.gold} /></Animated.View>
        </View>
        <FadeIn delay={350} rise={14} duration={600} style={{ alignItems: 'center', marginTop: 26 }}>
          <T v="display" color={colors.white} style={{ letterSpacing: 10, fontSize: 34, lineHeight: 42 }}>STAYLUX</T>
        </FadeIn>
        <FadeIn delay={650} rise={10} duration={600} style={{ alignItems: 'center', marginTop: 10 }}>
          <View style={{ width: 44, height: 1.5, backgroundColor: colors.gold, marginBottom: 14 }} />
          <T v="body" color={overlay.onDarkStrong} style={{ textAlign: 'center', letterSpacing: 1 }}>Quiet luxury, by the sea</T>
        </FadeIn>
      </View>

      <FadeIn delay={1000} rise={24} duration={650} style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 28, gap: 14 }}>
        <Button title="Get Started" variant="gold" onPress={() => router.push('/login')} />
        <Pressable onPress={() => router.push('/register')} hitSlop={10} accessibilityLabel="Create an account" style={{ alignItems: 'center', paddingVertical: 6 }}>
          <T v="small" color={overlay.onDark} style={{ fontSize: fontSizes.eyebrow }}>New guest? <T v="small" color={colors.gold} style={{ fontSize: fontSizes.eyebrow, fontWeight: '700' }}>Create an account</T></T>
        </Pressable>
      </FadeIn>
    </View>
  );
}
