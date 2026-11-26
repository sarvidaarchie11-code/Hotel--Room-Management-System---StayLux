import React, { useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Star } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { Room } from '@/types';
import { money } from '@/utils/format';
import { Img } from './Img';
import { LogoMark } from './Logo';
import { Button, T } from './ui';


/** Full-bleed featured-room carousel at the top of Home: swipe, auto-advances, tap opens the room. */
export function HeroCarousel({ rooms, hotel, greeting, firstName, unread, onBell }: { rooms: Room[]; hotel: string; greeting: string; firstName: string; unread: number; onBell: () => void }) {
  const { width, height } = useWindowDimensions();
  const HERO_H = Math.round(Math.min(520, Math.max(360, height * 0.5))); // scales with the screen
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList<Room>>(null);
  const current = useRef(0);
  const dragging = useRef(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (rooms.length < 2) return;
    const t = setInterval(() => {
      if (dragging.current) return;
      const next = (current.current + 1) % rooms.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      current.current = next;
      setIndex(next);
    }, 5500);
    return () => clearInterval(t);
  }, [rooms.length]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    current.current = i; dragging.current = false; setIndex(i);
  };
  const open = (r: Room) => router.push({ pathname: '/room/[id]', params: { id: String(r.id) } });

  return (
    <View style={{ height: HERO_H, backgroundColor: colors.navy, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
      <FlatList
        ref={listRef}
        data={rooms}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(r) => String(r.id)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onMomentumScrollEnd={onEnd}
        onScrollToIndexFailed={() => undefined}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={{ width, height: HERO_H }}>
            <Img uri={imageUrl(item.primaryImage)!} style={{ position: 'absolute', width, height: HERO_H }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, backgroundColor: 'rgba(10,14,30,0.38)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, backgroundColor: 'rgba(10,14,30,0.34)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 170, backgroundColor: 'rgba(10,14,30,0.32)' }} />
            <View style={{ position: 'absolute', left: 22, right: 22, bottom: 50, gap: 4 }}>
              <T v="small" color={colors.gold} style={{ fontWeight: '800', letterSpacing: 1.2 }}>{item.category.name.toUpperCase()}</T>
              <T v="display" color={colors.white} numberOfLines={2}>{item.name}</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <View style={{ gap: 2 }}>
                  <T v="h2" color={colors.white}>{money(item.pricePerNight)}<T v="small" color="rgba(255,255,255,0.75)"> / night</T></T>
                  {item.avgRating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star size={13} color={colors.gold} fill={colors.gold} /><T v="small" color={colors.white}>{item.avgRating.toFixed(1)} ({item.reviewCount})</T>
                    </View>
                  ) : null}
                </View>
                <Button title="Book Now" variant="gold" small onPress={() => router.push({ pathname: '/book/[roomId]', params: { roomId: String(item.id) } })} />
              </View>
            </View>
          </Pressable>
        )}
      />
      {/* fixed overlay: brand, bell, greeting */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 10, left: 20, right: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LogoMark size={34} />
          <T v="h3" color={colors.white} style={{ flex: 1, letterSpacing: 3, fontSize: 14 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{hotel.toUpperCase()}</T>
          <Pressable onPress={onBell} hitSlop={12} accessibilityLabel="Notifications" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Bell color={colors.white} size={20} />
            {unread ? <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: colors.danger, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}><T v="small" color={colors.white} style={{ fontSize: 10, fontWeight: '800' }}>{unread}</T></View> : null}
          </Pressable>
        </View>
        <T v="small" color="rgba(255,255,255,0.85)" style={{ marginTop: 18 }}>{greeting},</T>
        <T v="h1" color={colors.white}>{firstName}</T>
      </View>
      {rooms.length > 1 ? (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
          {rooms.map((r, i) => <View key={r.id} style={{ width: i === index ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === index ? colors.gold : 'rgba(255,255,255,0.55)' }} />)}
        </View>
      ) : null}
    </View>
  );
}
