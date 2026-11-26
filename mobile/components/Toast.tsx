import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { colors, shadow } from '@/constants/theme';

type Kind = 'success' | 'error' | 'info';
interface ToastApi { show: (message: string, kind?: Kind) => void }
const Ctx = createContext<ToastApi | null>(null);

/** Non-blocking feedback that slides in from the top and fades away (replaces pop-up dialogs for simple confirmations). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: Kind } | null>(null);
  const a = useRef(new Animated.Value(0)).current;
  const slide = useRef(a.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] })).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: Kind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind });
    Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 7 }).start();
    timer.current = setTimeout(() => {
      Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
    }, 2600);
  }, [a]);

  const api = useMemo(() => ({ show }), [show]);
  const Icon = toast?.kind === 'error' ? AlertCircle : toast?.kind === 'info' ? Info : CheckCircle2;
  return (
    <Ctx.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8, opacity: a, transform: [{ translateY: slide }] }]}>
          <View style={styles.pill}>
            <Icon size={20} color={toast.kind === 'error' ? colors.dangerOnDark : colors.gold} />
            <Text style={styles.text} numberOfLines={2}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used inside ToastProvider');
  return v;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(27,39,71,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingVertical: 13, paddingHorizontal: 18, maxWidth: '100%', ...shadow.lift },
  text: { color: colors.white, fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
