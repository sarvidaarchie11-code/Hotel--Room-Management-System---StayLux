import React, { useEffect, useRef, useState } from 'react';

import {

   ActivityIndicator, Animated, KeyboardAvoidingView, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, StyleProp,

   StyleSheet, Text, TextInput, TextInputProps, TextProps, TextStyle, View, ViewStyle,

} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Circle, Path } from 'react-native-svg';

import { useRouter } from 'expo-router';

import { AlertCircle, ChevronLeft, Inbox, WifiOff } from 'lucide-react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

import { BOOKING_STATUS_COLORS, STATUS_LABEL, colors, fonts, glass, glassShadow, radius, shadow, type } from '@/constants/theme';



type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label';

const textStyles: Record<Variant, TextStyle> = {

   display: { fontFamily: fonts.serif, fontSize: type.display, lineHeight: 37, fontWeight: '600', color: colors.navy, letterSpacing: 0.2 },

   h1: { fontFamily: fonts.serif, fontSize: type.h1, lineHeight: 31, fontWeight: '600', color: colors.navy, letterSpacing: 0.15 },

   h2: { fontFamily: fonts.serif, fontSize: type.h2, lineHeight: 25, fontWeight: '600', color: colors.navy },

   h3: { fontSize: type.h3, lineHeight: 22, fontWeight: '600', color: colors.ink },

   body: { fontSize: type.body, lineHeight: 22, color: colors.ink },

   small: { fontSize: type.small, lineHeight: 18, color: colors.muted },

   label: { fontSize: type.small, lineHeight: 18, fontWeight: '600', color: colors.sage },

};



export function T({ v = 'body', color, style, ...rest }: TextProps & { v?: Variant; color?: string }) {

   return <Text {...rest} style={[textStyles[v], color ? { color } : null, style]} />;

}



/** Gentle fade-in on mount. Opacity only and a single stable animated value, so typing / re-rendering never disturbs the layout. */

export function FadeIn({ children, style, duration = 200, delay = 0, rise = 0 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; duration?: number; delay?: number; rise?: number }) {

   const v = useRef(new Animated.Value(0)).current;

   const lift = useRef(v.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] })).current; // created once, so re-renders never disturb it

   const reduce = useReduceMotion();

   useEffect(() => { Animated.timing(v, { toValue: 1, duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, useNativeDriver: true }).start(); }, [v, duration, delay, reduce]);

   return <Animated.View style={[{ opacity: v, transform: rise ? [{ translateY: lift }] : undefined }, style]}>{children}</Animated.View>;

}



/** List entrance: items fade and rise one after another (only the first few, so scrolling never re-plays it). */

export function Reveal({ index = 0, children, style }: { index?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {

   if (index > 5) return <View style={style}>{children}</View>;

   return <FadeIn delay={index * 70} rise={14} duration={320} style={style}>{children}</FadeIn>;

}



/**

  * Keeps text boxes visible above the keyboard. Newer Android versions draw edge-to-edge and no longer resize the screen

  * when the keyboard opens, so every screen with inputs needs this on both iOS and Android.

  */

export function KeyboardView({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {

   return <KeyboardAvoidingView style={[{ flex: 1 }, style]} behavior="padding">{children}</KeyboardAvoidingView>;

}



/** A plain wrapping group of chips (never a swipe row). Prefer Segmented / SelectPill for filters. */

export function ChipRow({ children }: { children: React.ReactNode }) {

   return <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{children}</View>;

}



/** A soft radial glow: many nearly-invisible stacked circles so there are no visible rings. */

export function Glow({ size, rgb, a, style }: { size: number; rgb: string; a: number; style: ViewStyle }) {

   const N = 16;

   return (

      <View style={[{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>

         {Array.from({ length: N }, (_, i) => {

            const d = size * (1 - (i / N) * 0.94);

            return <View key={i} style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: `rgba(${rgb},${a})` }} />;

         })}

      </View>

   );

}



/** Faint hotel arch + monogram ring, drawn once per screen as a watermark. */

function Watermark() {

   return (

      <View style={{ position: 'absolute', right: -90, bottom: 70, opacity: 0.07 }}>

         <Svg width={360} height={360} viewBox="0 0 100 100">

            <Circle cx="50" cy="50" r="46" stroke={colors.navy} strokeWidth="1.2" fill="none" />

            <Circle cx="50" cy="50" r="40" stroke={colors.navy} strokeWidth="0.5" fill="none" />

            <Path d="M30 74 V46 A20 20 0 0 1 70 46 V74" stroke={colors.navy} strokeWidth="1.2" fill="none" strokeLinecap="round" />

            <Path d="M61 42 C61 31 39 31 39 43 C39 54 61 53 61 64 C61 76 39 76 39 65" stroke={colors.navy} strokeWidth="1.4" fill="none" strokeLinecap="round" />

         </Svg>

      </View>

   );

}



/** The glows dissolve into the page colour at the bottom, so there is never a seam above the navigation bar. */

function BottomFade() {

   return (

      <>

         {Array.from({ length: 12 }, (_, i) => (

            <View key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: i * 7, height: 7, backgroundColor: `rgba(243,242,248,${(1 - i / 12).toFixed(2)})` }} />

         ))}

      </>

   );

}



/** Colour behind the glass cards: periwinkle, blush and aqua glows, a brand watermark, and a soft fade at the bottom. */

export function Backdrop({ compact }: { compact?: boolean }) {

   if (compact) return null;

   return (

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>

         <Glow size={480} rgb="95,120,200" a={0.034} style={{ top: -170, right: -180 }} />

         <Glow size={400} rgb="224,150,118" a={0.03} style={{ top: 250, left: -220 }} />

         <Glow size={380} rgb="110,190,200" a={0.026} style={{ top: 470, right: -210 }} />

         <Watermark />

         <BottomFade />

      </View>

   );

}



interface ScreenProps {

   children: React.ReactNode;

   scroll?: boolean;

   refreshing?: boolean;

   onRefresh?: () => void;

   onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;

   scrollRef?: React.Ref<ScrollView>;

   bg?: string;

   padded?: boolean;

   footer?: React.ReactNode;

   topInset?: boolean; // false = content (e.g. a hero image) draws under the status bar

}



export function Screen({ children, scroll = true, refreshing, onRefresh, onScroll, scrollRef, bg = colors.ivory, padded = true, footer, topInset = true }: ScreenProps) {

   return (

      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={topInset ? ['top'] : []}>

         <Backdrop />

         <KeyboardView>

         {scroll ? (

            <ScrollView

              ref={scrollRef as any}

               onScroll={onScroll}

               scrollEventThrottle={16}

               showsVerticalScrollIndicator={false}

               keyboardShouldPersistTaps="handled"

               contentContainerStyle={[padded && { padding: 20 }, { paddingBottom: 40 }]}

               refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.gold} /> : undefined}

            >

               <FadeIn style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>{children}</FadeIn>

            </ScrollView>

         ) : (

            <FadeIn style={[{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }, padded && { padding: 20 }]}>{children}</FadeIn>

         )}

         </KeyboardView>

         {footer}

      </SafeAreaView>

   );

}



export function Header({ title, right, back = true }: { title: string; right?: React.ReactNode; back?: boolean }) {

   const router = useRouter();

   return (

      <View style={s.header}>

         {back ? (

            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} accessibilityLabel="Go back" style={({ pressed }) => [s.backBtn, pressed && { transform: [{ scale: 0.92 }] }]}>

               <ChevronLeft color={colors.navy} size={22} />

            </Pressable>

         ) : <View style={{ width: 8 }} />}

         <T v="h1" style={{ flex: 1, fontSize: 23 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</T>

         {right}

      </View>

   );

}



export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, small }: {

   title: string; onPress: () => void; variant?: 'primary' | 'gold' | 'outline' | 'danger' | 'ghost';

   loading?: boolean; disabled?: boolean; icon?: React.ReactNode; style?: StyleProp<ViewStyle>; small?: boolean;

}) {

   const palette = {

      primary: { bg: colors.navy, fg: colors.white, border: colors.navy, raised: true },

      gold: { bg: colors.gold, fg: colors.white, border: colors.gold, raised: true },

      outline: { bg: colors.white, fg: colors.navy, border: colors.line, raised: false },

      danger: { bg: colors.white, fg: colors.danger, border: colors.dangerBorder, raised: false },

      ghost: { bg: 'transparent', fg: colors.sage, border: 'transparent', raised: false },

   }[variant];

   const off = disabled || loading;

   return (

      <Pressable

         onPress={onPress}

         disabled={off}

         hitSlop={8}

         style={({ pressed }) => [

            s.btn, small && { paddingVertical: 10, paddingHorizontal: 16 },

            { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },

            palette.raised && !off ? shadow.soft : null,

            style,

         ]}

      >

         {loading ? <ActivityIndicator color={palette.fg} /> : (

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

               {icon}

               {title ? <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: palette.fg, fontWeight: '700', fontSize: small ? 13 : 15, letterSpacing: 0.2, flexShrink: 1 }}>{title}</Text> : null}

            </View>

         )}

      </Pressable>

   );

}



export type InputFilter = 'letters' | 'digits' | 'decimal' | 'phone' | 'coords';

const FILTERS: Record<InputFilter, { strip: RegExp; message: string; keyboard: TextInputProps['keyboardType'] }> = {

   letters: { strip: /[^A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u017F\s.'\u2019-]/g, message: 'Letters only - numbers and symbols are not allowed here', keyboard: 'default' },

   digits: { strip: /[^0-9]/g, message: 'Numbers only - letters are not allowed here', keyboard: 'number-pad' },

   decimal: { strip: /[^0-9.]/g, message: 'Numbers only - letters are not allowed here', keyboard: 'decimal-pad' },

   phone: { strip: /[^0-9+\-\s]/g, message: 'Digits only (you may use + and -)', keyboard: 'phone-pad' },

   coords: { strip: /[^0-9.\-]/g, message: 'Numbers only (use - for a negative value)', keyboard: 'numbers-and-punctuation' },

};

function clean(filter: InputFilter, text: string): string {

   let v = text.replace(FILTERS[filter].strip, '');

   if (filter === 'decimal') { const [head, ...rest] = v.split('.'); v = rest.length ? `${head}.${rest.join('')}` : v; }

   return v;

}



type InputProps = Omit<TextInputProps, 'ref'> & { label?: string; error?: string; icon?: React.ReactNode; right?: React.ReactNode; filter?: InputFilter; ref?: React.Ref<any> };



export function Input({ label, error, icon, right, style, onFocus, onBlur, filter, onChangeText, ref, ...rest }: InputProps) {

   const [focused, setFocused] = useState(false); // onFocus / onBlur events drive the focus ring

   const [notice, setNotice] = useState('');

   const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

   const handleChange = (text: string) => {

      if (!filter) return onChangeText?.(text);

      const cleaned = clean(filter, text);

      if (cleaned !== text) { // a blocked character was typed: drop it and explain why

         setNotice(FILTERS[filter].message);

         if (timer.current) clearTimeout(timer.current);

         timer.current = setTimeout(() => setNotice(''), 2600);

      }

      onChangeText?.(cleaned);

   };

   const shown = error ?? notice;

   return (

      <View style={{ marginBottom: 14 }}>

         {label ? <T v="label" color={colors.ink} style={{ marginBottom: 6 }}>{label}</T> : null}

         <View style={[s.inputWrap, { borderColor: error ? colors.danger : notice ? colors.warn : focused ? colors.gold : colors.line }]}>

            {icon}

            <TextInput

               ref={ref as any}
               {...rest}

               keyboardType={rest.keyboardType ?? (filter ? FILTERS[filter].keyboard : undefined)}

               onChangeText={handleChange}

               placeholderTextColor={colors.placeholder}

               style={[s.input, rest.multiline && { minHeight: 84, textAlignVertical: 'top' }, style]}

               onFocus={(e) => { setFocused(true); onFocus?.(e); }}

               onBlur={(e) => { setFocused(false); onBlur?.(e); }}

            />

            {right}

         </View>

         {shown ? <T v="small" color={error ? colors.danger : colors.warn} style={{ marginTop: 4 }}>{shown}</T> : null}

      </View>

   );

}



export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {

   const body = [s.card, style];

   return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [...body, pressed && { transform: [{ scale: 0.985 }] }]}>{children}</Pressable> : <View style={body}>{children}</View>;

}



export function Badge({ text, tone }: { text: string; tone?: string }) {

   const c = BOOKING_STATUS_COLORS[tone ?? text] ?? { bg: colors.navySoft, fg: colors.navy };

   return (

      <View style={{ backgroundColor: c.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>

         <Text numberOfLines={1} style={{ color: c.fg, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 }}>{STATUS_LABEL[text] ?? text}</Text>

      </View>

   );

}



export function Chip({ text, active, onPress }: { text: string; active?: boolean; onPress?: () => void }) {

   return (

      <Pressable onPress={onPress} style={({ pressed }) => [s.chip, active && s.chipActive, pressed && { transform: [{ scale: 0.95 }] }]}>

         <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: active ? colors.white : colors.ink, fontSize: 13, fontWeight: active ? '700' : '500' }}>{text}</Text>

      </Pressable>

   );

}



export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {

   return (

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }}>

         <T v="h2">{title}</T>

         {action ? <Pressable onPress={onAction} hitSlop={8}><T v="label" color={colors.gold}>{action}</T></Pressable> : null}

      </View>

   );

}



/** Pulsing placeholder blocks - feels faster and calmer than a spinner. */

function SkeletonCard({ pulse }: { pulse: Animated.Value }) {

   const block = (w: number | string, h: number, extra?: object) => <Animated.View style={[{ width: w as never, height: h, borderRadius: 8, backgroundColor: colors.navySoft, opacity: pulse }, extra]} />;

   return (

      <View style={[s.card, { flexDirection: 'row', gap: 12, padding: 12 }]}>

         {block(76, 76, { borderRadius: 14 })}

         <View style={{ flex: 1, gap: 9, justifyContent: 'center' }}>{block('45%', 11)}{block('80%', 15)}{block('60%', 11)}</View>

      </View>

   );

}



export function Loading({ compact }: { compact?: boolean }) {

   const pulse = useRef(new Animated.Value(0.55)).current;

   useEffect(() => {

      if (compact) return;

      const loop = Animated.loop(Animated.sequence([

         Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),

         Animated.timing(pulse, { toValue: 0.55, duration: 650, useNativeDriver: true }),

      ]));

      loop.start();

      return () => loop.stop();

   }, [pulse, compact]);

   if (compact) return <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.gold} /></View>;

   return <View style={{ gap: 12, paddingVertical: 6 }}>{[0, 1, 2].map((i) => <SkeletonCard key={i} pulse={pulse} />)}</View>;

}



export function EmptyState({ title, hint, action, icon }: { title: string; hint?: string; action?: React.ReactNode; icon?: React.ReactNode }) {

   return (

      <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 28, gap: 6 }}>

         <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>

            {icon ?? <Inbox size={26} color={colors.sage} />}

         </View>

         <T v="h3" style={{ textAlign: 'center' }}>{title}</T>

         {hint ? <T v="small" style={{ textAlign: 'center' }}>{hint}</T> : null}

         {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}

      </View>

   );

}



/** One slim line instead of a big red box. Network failures get a short, friendly wording. */

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {

   const offline = /cannot reach the server/i.test(message);

   const Icon = offline ? WifiOff : AlertCircle;

   return (

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.dangerSoft, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12 }}>

         <Icon size={18} color={colors.danger} />

         <T v="small" color={colors.danger} style={{ flex: 1 }} numberOfLines={3}>{offline ? "Can't reach the server" : message}</T>

         {onRetry ? <Pressable onPress={onRetry} hitSlop={10}><T v="label" color={colors.danger}>Retry</T></Pressable> : null}

      </View>

   );

}



/** Primary actions pinned to the bottom of a screen (so they never get lost in a long form). */

export function StickyFooter({ children }: { children: React.ReactNode }) {

   const insets = useSafeAreaInsets();

   return (

      <View style={{ backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: glass.edge, flexDirection: 'row', gap: 10, alignItems: 'center' }}>

         {children}

      </View>

   );

}



export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {

   return (

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 }}>

         <T v="small">{label}</T>

         <T v="body" style={[{ flexShrink: 1, textAlign: 'right' }, bold && { fontWeight: '700', color: colors.navy }]}>{value}</T>

      </View>

   );

}



/** Modal with a text field - used where a reason / note is required (e.g. rejecting a booking). */

export function PromptModal({ visible, title, placeholder, confirmText = 'Submit', onCancel, onSubmit }: {

   visible: boolean; title: string; placeholder?: string; confirmText?: string; onCancel: () => void; onSubmit: (text: string) => void;

}) {

   const [text, setText] = useState('');

   return (

      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>

         <View style={s.backdrop}>

            <View style={s.modal}>

               <T v="h2" style={{ marginBottom: 12 }}>{title}</T>

               <Input value={text} onChangeText={setText} placeholder={placeholder} multiline />

               <View style={{ flexDirection: 'row', gap: 10 }}>

                  <Button title="Cancel" variant="outline" onPress={() => { setText(''); onCancel(); }} style={{ flex: 1 }} />

                  <Button title={confirmText} onPress={() => { const t = text.trim(); if (t) { onSubmit(t); setText(''); } }} style={{ flex: 1 }} />

               </View>

            </View>

         </View>

      </Modal>

   );

}



export const s = StyleSheet.create({

   header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },

   backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: glass.strong, borderWidth: 1, borderColor: glass.edge, alignItems: 'center', justifyContent: 'center', ...glassShadow },

   btn: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },

   inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: glass.strong, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 14 },

   input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.ink },

   card: { backgroundColor: glass.fill, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: glass.edge, ...glassShadow },

   chip: { borderWidth: 1, borderColor: glass.edge, backgroundColor: glass.fill, borderRadius: radius.pill, paddingHorizontal: 14, height: 34, justifyContent: 'center', marginRight: 8, marginBottom: 8 },

   chipActive: { backgroundColor: colors.navy, borderColor: colors.navy, ...shadow.soft },

   backdrop: { flex: 1, backgroundColor: 'rgba(27,39,71,0.55)', justifyContent: 'center', padding: 24 },

   modal: { backgroundColor: 'rgba(243,242,248,0.96)', borderWidth: 1, borderColor: glass.edge, borderRadius: radius.lg, padding: 20 },

});