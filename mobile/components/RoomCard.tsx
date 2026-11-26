import React, { useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BedDouble, Heart, Info, RotateCcw, Star, Users } from 'lucide-react-native';
import { colors, glass, glassShadow, radius, overlay } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Room } from '@/types';
import { money } from '@/utils/format';
import { Badge, Button, Reveal, T } from './ui';
import { FlipCard } from './FlipCard';
import { Img } from './Img';
import { LogoMark } from './Logo';

const card = { backgroundColor: glass.fill, borderRadius: radius.lg, overflow: 'hidden' as const, borderWidth: 1, borderColor: glass.edge, ...glassShadow };

export function RoomCard({ room, compact, index }: { room: Room; compact?: boolean; index?: number }) {
  const router = useRouter();
  const { isFav, toggle } = useFavorites();
  const [flipped, setFlipped] = useState(false);
  const pop = useRef(new Animated.Value(1)).current;
  const open = () => router.push({ pathname: '/room/[id]', params: { id: String(room.id) } }); // ROOM SELECTION event
  const book = () => router.push({ pathname: '/book/[roomId]', params: { roomId: String(room.id) } });
  const uri = imageUrl(room.primaryImage);
  const fav = isFav(room.id);
  const h = compact ? 150 : 190;

  const onHeart = () => { // micro-animation: the heart pops
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.4, duration: 110, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    void toggle(room.id);
  };

  const front = (
    <Pressable onPress={open} style={({ pressed }) => [card, { width: compact ? 260 : undefined, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      {uri ? <Img uri={uri} style={{ width: '100%', height: h }} /> : (
        <View style={{ height: h, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}><LogoMark size={44} /></View>
      )}
      <View style={{ position: 'absolute', top: 12, left: 12 }}><Badge text={room.status} /></View>
      <View style={{ position: 'absolute', top: 10, right: 10, gap: 8 }}>
        <Pressable onPress={onHeart} hitSlop={10} accessibilityLabel="Save room" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: overlay.whiteChip, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ transform: [{ scale: pop }] }}><Heart size={18} color={fav ? colors.danger : colors.navy} fill={fav ? colors.danger : 'none'} /></Animated.View>
        </Pressable>
        {!compact ? (
          <Pressable onPress={() => setFlipped(true)} hitSlop={10} accessibilityLabel="Room details" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: overlay.whiteChip, alignItems: 'center', justifyContent: 'center' }}>
            <Info size={18} color={colors.navy} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ padding: 14, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T v="small" color={colors.gold} style={{ fontWeight: '700' }}>{room.category.name}</T>
          {room.avgRating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={13} color={colors.gold} fill={colors.gold} /><T v="small" color={colors.navy} style={{ fontWeight: '700' }}>{room.avgRating.toFixed(1)}</T><T v="small">({room.reviewCount})</T>
            </View>
          ) : null}
        </View>
        <T v="h2" numberOfLines={2}>{room.name}</T>
        <View style={{ flexDirection: 'row', gap: 14, marginVertical: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Users size={14} color={colors.sage} /><T v="small">{room.maxGuests} guests</T></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><BedDouble size={14} color={colors.sage} /><T v="small">{room.numberOfBeds} {room.bedType}</T></View>
        </View>
        <T v="h2" color={colors.navy}>{money(room.pricePerNight)}<T v="small"> / night</T></T>
        {!compact ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Button title="View Details" variant="outline" small onPress={open} style={{ flex: 1 }} />
            <Button title="Book Now" variant="gold" small onPress={book} style={{ flex: 1 }} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  // back of the card: description, amenities and quick actions
  const back = (
    <View style={[card, { flex: 1, padding: 16, gap: 8, backgroundColor: glass.strong }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="small" color={colors.gold} style={{ fontWeight: '700' }}>{room.category.name} · Room {room.roomNumber}</T>
        <Pressable onPress={() => setFlipped(false)} hitSlop={10} accessibilityLabel="Flip back" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={16} color={colors.navy} />
        </Pressable>
      </View>
      <T v="h2" numberOfLines={2}>{room.name}</T>
      <T v="small" numberOfLines={4}>{room.description}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
        {room.amenities.slice(0, 6).map((a) => (
          <View key={a.id} style={{ backgroundColor: colors.navySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><T v="small" color={colors.navy} style={{ fontSize: 11.5, fontWeight: '600' }}>{a.name}</T></View>
        ))}
        {room.amenities.length > 6 ? <T v="small" style={{ alignSelf: 'center' }}>+{room.amenities.length - 6} more</T> : null}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Details" variant="outline" small onPress={open} style={{ flex: 1 }} />
        <Button title="Book Now" variant="gold" small onPress={book} style={{ flex: 1 }} />
      </View>
    </View>
  );

  const body = compact ? <View style={{ marginRight: 14 }}>{front}</View> : <FlipCard flipped={flipped} front={front} back={back} style={{ marginBottom: 16 }} />;
  return index === undefined ? body : <Reveal index={index}>{body}</Reveal>;
}
