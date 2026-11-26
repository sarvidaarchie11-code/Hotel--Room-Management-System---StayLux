import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Bell, Search } from 'lucide-react-native';
import { colors, glass, glassShadow, radius, fontSizes, overlay } from '@/constants/theme';
import { BookingCard } from '@/components/BookingCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { HotelMap } from '@/components/HotelMap';
import { LogoMark } from '@/components/Logo';
import { RoomCard } from '@/components/RoomCard';
import { Card, ErrorBanner, Input, Loading, Screen, SectionTitle, T } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLoad } from '@/hooks/useLoad';
import { api } from '@/services/api';
import { Booking, Category, HotelSettings, Offer, Room } from '@/types';
import { categoryIcon } from '@/utils/categoryIcon';
import { day } from '@/utils/format';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { unread } = useNotifications();
  const [query, setQuery] = useState('');
  const { data, loading, error, refreshing, onRefresh, reload } = useLoad(async () => {
    const [featured, avail, cats, offers, mine, settings] = await Promise.all([
      api.get<{ rooms: Room[] }>('/rooms', { params: { featured: true } }),
      api.get<{ rooms: Room[] }>('/rooms'),
      api.get<{ categories: Category[] }>('/categories'),
      api.get<{ offers: Offer[] }>('/offers'),
      api.get<{ bookings: Booking[] }>('/bookings', { params: { page: 1, pageSize: 1 } }),
      api.get<{ settings: HotelSettings }>('/settings'),
    ]);
    const withPhoto = (rooms: Room[]) => rooms.filter((r) => r.primaryImage);
    const availableRooms = avail.data.rooms.filter((r) => r.status === 'Available');
    // hero: featured rooms first, otherwise any rooms that have a photo
    const hero = withPhoto(featured.data.rooms).length ? withPhoto(featured.data.rooms) : withPhoto(avail.data.rooms);
    return {
      hero: hero.slice(0, 5),
      available: availableRooms.slice(0, 6),
      categories: cats.data.categories,
      offers: offers.data.offers,
      recent: mine.data.bookings[0] ?? null,
      settings: settings.data.settings,
    };
  }, ['room', 'booking', 'offer', 'category', 'settings'], 'home');

  // light status-bar icons while the dark hero is on screen
  useFocusEffect(useCallback(() => { setStatusBarStyle('light'); return () => setStatusBarStyle('dark'); }, []));

  const search = () => router.push({ pathname: '/explore', params: { search: query.trim() } }); // SEARCH submit event
  const firstName = user?.fullName.split(' ')[0] ?? '';
  const hotel = data?.settings.name ?? 'StayLux';
  const hasHero = !!data && data.hero.length > 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} padded={false} topInset={false}>
      {hasHero ? (
        <HeroCarousel rooms={data!.hero} hotel={hotel} greeting={greeting()} firstName={firstName} unread={unread} onBell={() => router.push('/notifications')} />
      ) : (
        <View style={{ backgroundColor: colors.navy, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 54, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LogoMark size={36} />
            <T v="h3" color={colors.gold} style={{ flex: 1, letterSpacing: 3, fontSize: fontSizes.eyebrow }}>{hotel.toUpperCase()}</T>
            <Pressable onPress={() => router.push('/notifications')} hitSlop={10} accessibilityLabel="Notifications"><Bell color={colors.white} size={22} /></Pressable>
          </View>
          <T v="small" color={overlay.onDarkStrong} style={{ marginTop: 22 }}>{greeting()},</T>
          <T v="display" color={colors.white}>{firstName}</T>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: -26 }}>
        <Input value={query} onChangeText={setQuery} placeholder="Search rooms, types, features" returnKeyType="search" onSubmitEditing={search} icon={<Search size={18} color={colors.muted} />} style={{ paddingVertical: 15 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {loading ? <Loading /> : data ? (
          <>
            {data.categories.length ? (
              <>
                <SectionTitle title="Room types" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {data.categories.map((c) => {
                    const Icon = categoryIcon(c.name);
                    return (
                      <Pressable key={c.id} onPress={() => router.push({ pathname: '/explore', params: { categoryId: String(c.id) } })} style={({ pressed }) => [{ width: '23%', flexGrow: 1, backgroundColor: glass.fill, borderWidth: 1, borderColor: glass.edge, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', gap: 8, ...glassShadow }, pressed && { transform: [{ scale: 0.96 }] }]}>
                        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={21} color={colors.navy} /></View>
                        <T v="small" color={colors.ink} style={{ fontWeight: '700', textAlign: 'center', fontSize: fontSizes.tiny }} numberOfLines={2}>{c.name.replace(/ Room$/i, '')}</T>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {data.recent ? (
              <>
                <SectionTitle title="Your latest booking" action="All" onAction={() => router.push('/bookings')} />
                <BookingCard booking={data.recent} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(data.recent!.id) } })} />
              </>
            ) : null}

            {data.offers.length ? (
              <>
                <SectionTitle title="Special offers" />
                {data.offers.slice(0, 2).map((o) => (
                  <View key={o.id} style={{ backgroundColor: overlay.offerFill, borderWidth: 1, borderColor: glass.edge, borderRadius: radius.lg, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    {o.discountPercent ? <T v="display" color={colors.navy} style={{ fontSize: fontSizes.display }}>{o.discountPercent}%</T> : null}
                    <View style={{ flex: 1 }}>
                      <T v="h3">{o.title}</T>
                      <T v="small" color={colors.navy} numberOfLines={2}>{o.description}</T>
                      <T v="small" style={{ marginTop: 4 }}>Check-in {day(o.validFrom, 'MMM d')} – {day(o.validUntil)}</T>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <SectionTitle title="Available now" action="Explore all" onAction={() => router.push('/explore')} />
            {data.available.length ? data.available.map((r) => <RoomCard key={r.id} room={r} />) : (
              <Card><T v="small">No rooms have been added yet. Please check back soon.</T></Card>
            )}

            {data.settings.latitude != null && data.settings.longitude != null ? (
              <>
                <SectionTitle title="Find us" />
                <HotelMap latitude={data.settings.latitude} longitude={data.settings.longitude} name={data.settings.name} address={data.settings.address} />
              </>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}
