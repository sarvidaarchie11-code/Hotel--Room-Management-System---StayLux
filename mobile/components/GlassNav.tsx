import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export interface NavItem { name: string; title: string; Icon: LucideIcon; badge?: number }

const BAR_H = 66; // glass capsule height
const LIFT = 24; // room above the capsule for the raised bubble (inside the touch area, so it is always tappable)
const BUBBLE = 54;

function NavButton({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  const up = useRef(new Animated.Value(active ? 1 : 0)).current; // 0 = resting, 1 = raised
  const press = useRef(new Animated.Value(0)).current; // 0 = released, 1 = pressed (3D tilt)

  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce) Animated.timing(up, { toValue: active ? 1 : 0, duration: 0, useNativeDriver: true }).start();
    else Animated.spring(up, { toValue: active ? 1 : 0, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
  }, [active, up, reduce]);

  // animated values are derived once, so re-renders never restart them
  const rise = useRef(up.interpolate({ inputRange: [0, 1], outputRange: [0, -20] })).current;
  const pop = useRef(up.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })).current;
  const bubbleScale = useRef(up.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] })).current;
  const tilt = useRef(press.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '38deg'] })).current;
  const squash = useRef(press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] })).current;

  const Icon = item.Icon;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { if (!reduce) Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start(); }}
      onPressOut={() => { if (!reduce) Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 14 }).start(); }}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ perspective: 500 }, { translateY: rise }, { rotateX: tilt }, { scale: squash }] }]}>
        {/* raised 3D bubble: navy disc, linen rim, glossy top half */}
        <Animated.View style={[styles.bubble, { opacity: up, transform: [{ scale: bubbleScale }] }]}>
          <View style={styles.sheen} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Icon size={22} color={active ? colors.white : colors.muted} strokeWidth={active ? 2.3 : 2} />
        </Animated.View>
        {item.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text></View> : null}
      </Animated.View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.label, { color: active ? colors.navy : colors.muted, fontWeight: active ? '800' : '500' }]}>{item.title}</Text>
    </Pressable>
  );
}

/**
 * Floating glass navigation bar. It reads the current route with usePathname() and navigates with router.navigate(),
 * so it does not depend on the tab navigator's own bar (which changes between Expo Router versions).
 */
export function GlassNav({ items }: { items: NavItem[] }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const [typing, setTyping] = useState(false);
  useEffect(() => { // the bar steps aside while the keyboard is open, so it never gets in the way of typing
    const show = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (typing) return null;
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.frame}>
        <View style={styles.base} pointerEvents="none" />
        <View style={styles.capsule} pointerEvents="none">
          <View style={styles.tints}>
            <View style={{ flex: 1, backgroundColor: 'rgba(75,95,143,0.08)' }} />
            <View style={{ flex: 1, backgroundColor: 'rgba(184,119,92,0.09)' }} />
          </View>
          <View style={styles.topLight} />
        </View>
        <View style={styles.row}>
          {items.map((item) => {
            const active = pathname === `/${item.name}` || pathname.startsWith(`/${item.name}/`);
            return <NavButton key={item.name} item={item} active={active} onPress={() => { if (!active) router.navigate(`/${item.name}` as never); }} />;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { backgroundColor: colors.ivory, paddingHorizontal: 16 },
  frame: { height: LIFT + BAR_H, width: '100%', maxWidth: 560, alignSelf: 'center' },
  // depth: a darker slab peeking out under the glass, like the edge of a thick pane
  base: { position: 'absolute', left: 8, right: 8, bottom: -5, height: BAR_H, borderRadius: BAR_H / 2, backgroundColor: 'rgba(27,39,71,0.16)' },
  capsule: { position: 'absolute', left: 0, right: 0, bottom: 0, height: BAR_H, borderRadius: BAR_H / 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)' },
  tints: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  topLight: { position: 'absolute', top: 0, left: 26, right: 26, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.98)' },
  row: { flexDirection: 'row', height: LIFT + BAR_H, paddingHorizontal: 6 },
  item: { flex: 1, height: LIFT + BAR_H, alignItems: 'center' },
  iconWrap: { position: 'absolute', top: LIFT - 2, width: BUBBLE, height: BUBBLE, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, backgroundColor: colors.navy, borderWidth: 4, borderColor: colors.ivory, overflow: 'hidden', shadowColor: colors.navy, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 9 },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%', backgroundColor: 'rgba(255,255,255,0.2)' },
  label: { position: 'absolute', bottom: 9, fontSize: 10.5, letterSpacing: 0.2 },
  badge: { position: 'absolute', top: 6, right: 4, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: colors.white },
  badgeText: { color: colors.white, fontSize: 9.5, fontWeight: '800' },
});
