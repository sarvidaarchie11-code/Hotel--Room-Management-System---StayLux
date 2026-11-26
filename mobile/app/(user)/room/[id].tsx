import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BedDouble, Building2, Heart, Maximize2, Star, Users } from 'lucide-react-native';
import { StarRating } from '@/components/StarRating';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Review } from '@/types';
import { day } from '@/utils/format';
import { colors, overlay } from '@/constants/theme';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ImageCarousel } from '@/components/ImageCarousel';
import { Badge, Button, Chip, ErrorBanner, Loading, Screen, SectionTitle, T } from '@/components/ui';
import { useLoad } from '@/hooks/useLoad';
import { api } from '@/services/api';
import { Room } from '@/types';
import { money } from '@/utils/format';
import { BlockedRange } from '@/components/DateRangePicker';

export default function RoomDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isFav, toggle } = useFavorites();
  const { data, loading, error, refreshing, onRefresh } = useLoad(
    async () => {
      const [r, rv] = await Promise.all([api.get<{ room: Room; bookedRanges: BlockedRange[] }>(`/rooms/${id}`), api.get<{ reviews: Review[] }>(`/rooms/${id}/reviews`)]);
      return { ...r.data, reviews: rv.data.reviews };
    },
    ['room', 'booking'],
    `room-${id}`,
  );
  const room = data?.room;
  const book = () => router.push({ pathname: '/book/[roomId]', params: { roomId: String(id) } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <Screen padded={false} refreshing={refreshing} onRefresh={onRefresh}>
        {loading ? <Loading /> : error || !room ? <View style={{ padding: 20 }}><ErrorBanner message={error ?? 'Room not found'} /></View> : (
          <>
            <ImageCarousel paths={room.images.map((i) => i.path)} width={width} height={300} />
            <View style={{ padding: 20, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T v="small" color={colors.gold} style={{ fontWeight: '700' }}>{room.category.name} · Room {room.roomNumber}</T>
                <Badge text={room.status} />
              </View>
              <T v="display">{room.name}</T>
              {room.avgRating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><StarRating value={room.avgRating} size={16} /><T v="small" color={colors.navy} style={{ fontWeight: '700' }}>{room.avgRating.toFixed(1)}</T><T v="small">({room.reviewCount} review{room.reviewCount === 1 ? '' : 's'})</T></View>
              ) : null}
              <T v="h2" color={colors.sage}>{money(room.pricePerNight)} <T v="small">per night</T></T>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                {[
                  { icon: Users, text: `${room.maxGuests} guests` },
                  { icon: BedDouble, text: `${room.numberOfBeds} × ${room.bedType}` },
                  { icon: Maximize2, text: room.size },
                  { icon: Building2, text: `Floor ${room.floor}` },
                ].map(({ icon: Icon, text }) => (
                  <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line }}>
                    <Icon size={16} color={colors.sage} /><T v="small" color={colors.navy}>{text}</T>
                  </View>
                ))}
              </View>

              <SectionTitle title="About this room" />
              <T v="body" style={{ lineHeight: 24 }}>{room.description}</T>

              {room.amenities.length ? (
                <>
                  <SectionTitle title="Amenities" />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{room.amenities.map((a) => <Chip key={a.id} text={a.name} />)}</View>
                </>
              ) : null}

              <SectionTitle title={`Guest reviews${data?.reviews.length ? ` (${data.reviews.length})` : ''}`} />
              {data?.reviews.length ? data.reviews.map((rv) => (
                <View key={rv.id} style={{ backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.line, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T v="h3">{rv.user.fullName}</T><StarRating value={rv.rating} size={14} /></View>
                  {rv.comment ? <T v="body">{rv.comment}</T> : null}
                  <T v="small">{day(rv.createdAt)}</T>
                </View>
              )) : <T v="small">No reviews yet.</T>}

              <SectionTitle title="Availability" />
              <DateRangePicker checkIn={null} checkOut={null} blocked={data?.bookedRanges ?? []} />
              <T v="small" style={{ marginTop: 8 }}>Red dates are already booked.</T>
              <View style={{ height: 90 }} />
            </View>
          </>
        )}
      </Screen>
      <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 54, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: overlay.whiteChip, alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft color={colors.navy} size={20} />
      </Pressable>
      {room ? (
        <Pressable onPress={() => void toggle(room.id)} style={{ position: 'absolute', top: 54, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: overlay.whiteChip, alignItems: 'center', justifyContent: 'center' }}>
          <Heart color={isFav(room.id) ? colors.danger : colors.navy} fill={isFav(room.id) ? colors.danger : 'none'} size={20} />
        </Pressable>
      ) : null}
      {room ? (
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
            <View style={{ flex: 1 }}><T v="small">From</T><T v="h2">{money(room.pricePerNight)}</T></View>
            <Button title="Reserve Room" variant="gold" onPress={book} style={{ paddingHorizontal: 40 }} />
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}
