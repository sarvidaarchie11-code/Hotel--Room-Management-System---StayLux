import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BedDouble, Bell, CheckCircle2, ChevronRight, CreditCard, DoorOpen, Hourglass, KeyRound, Users } from 'lucide-react-native';
import { colors, fontSizes, overlay } from '@/constants/theme';
import { BarChart, HBarChart } from '@/components/BarChart';
import { CountUp } from '@/components/CountUp';
import { FlipCard } from '@/components/FlipCard';
import { BookingCard } from '@/components/BookingCard';
import { LogoMark } from '@/components/Logo';
import { Card, Chip, ChipRow, EmptyState, ErrorBanner, Loading, Screen, SectionTitle, T } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Segmented } from '@/components/Pickers';
import { useLoad } from '@/hooks/useLoad';
import { api } from '@/services/api';
import { Dashboard as DashboardData } from '@/types';
import { money } from '@/utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { unread } = useNotifications();
  const [flippedStat, setFlippedStat] = useState<string | null>(null);
  const [chart, setChart] = useState<'revenue' | 'bookings' | 'rooms'>('revenue');
  const { data, loading, error, refreshing, onRefresh, reload } = useLoad(() => api.get<DashboardData>('/admin/dashboard').then((r) => r.data), ['room', 'booking', 'payment', 'user']);

  const t = data?.totals;
  const pct = (n: number) => (t && t.totalRooms ? `${Math.round((n / t.totalRooms) * 100)}%` : '0%');
  const cards = t ? [
    { label: 'Total rooms', value: t.totalRooms, Icon: BedDouble, back: `${t.reservedRooms} reserved, ${Math.max(0, t.totalRooms - t.availableRooms - t.occupiedRooms - t.reservedRooms)} other` },
    { label: 'Available', value: t.availableRooms, Icon: DoorOpen, back: `${pct(t.availableRooms)} of all rooms are free` },
    { label: 'Occupied', value: t.occupiedRooms, Icon: KeyRound, back: `${pct(t.occupiedRooms)} occupancy right now` },
    { label: 'Registered guests', value: t.totalUsers, Icon: Users, back: 'Guest accounts in the app' },
  ] : [];
  const waitingBookings = t?.pendingReservations ?? 0;
  const waitingPayments = t?.pendingPayments ?? 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <LogoMark size={44} color={colors.navy} />
        <View style={{ flex: 1 }}>
          <T v="small">Welcome back</T>
          <T v="h2" numberOfLines={2}>{user?.fullName}</T>
        </View>
        <Pressable onPress={() => router.push('/manage/notifications')} hitSlop={10} accessibilityLabel="Notifications">
          <Bell color={colors.navy} size={24} />
          {unread ? <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: colors.gold, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}><T v="small" color={colors.navy} style={{ fontSize: fontSizes.micro, fontWeight: '800' }}>{unread}</T></View> : null}
        </Pressable>
      </View>
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : data && t ? (
        <>
          <Card style={{ padding: 6, marginBottom: 14 }}>
            <T v="small" style={{ paddingHorizontal: 12, paddingTop: 10, fontWeight: '700', letterSpacing: 0.6 }}>NEEDS YOUR ATTENTION</T>
            {waitingBookings + waitingPayments === 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}><CheckCircle2 size={20} color={colors.sage} /><T v="h3">All caught up</T></View>
            ) : (
              <>
                {waitingBookings > 0 ? (
                  <Pressable onPress={() => router.push('/reservations')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, opacity: pressed ? 0.6 : 1 })}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}><Hourglass size={19} color={colors.gold} /></View>
                    <T v="h3" style={{ flex: 1 }}>{waitingBookings} booking request{waitingBookings === 1 ? '' : 's'} to review</T><ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                ) : null}
                {waitingPayments > 0 ? (
                  <Pressable onPress={() => router.push('/payments')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, opacity: pressed ? 0.6 : 1 })}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}><CreditCard size={19} color={colors.gold} /></View>
                    <T v="h3" style={{ flex: 1 }}>{waitingPayments} payment{waitingPayments === 1 ? '' : 's'} to verify</T><ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                ) : null}
              </>
            )}
          </Card>
          <View style={{ backgroundColor: colors.navy, borderRadius: 24, padding: 20, marginBottom: 14 }}>
            <T v="small" color={overlay.onDark}>Revenue collected</T>
            <T v="display" color={colors.gold} style={{ marginTop: 4 }}>{money(t.totalRevenue)}</T>
            <T v="small" color={overlay.onDark} style={{ marginTop: 2 }}>Verified payments only</T>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {cards.map(({ label, value, Icon, back }) => (
              <FlipCard
                key={label}
                flipped={flippedStat === label}
                style={{ width: '47.5%' }}
                front={
                  <Pressable onPress={() => setFlippedStat(label)}>
                    <Card style={{ padding: 14, gap: 10, minHeight: 112 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={colors.navy} /></View>
                      <View><CountUp value={value} /><T v="small">{label}</T></View>
                    </Card>
                  </Pressable>
                }
                back={
                  <Pressable onPress={() => setFlippedStat(null)} style={{ flex: 1 }}>
                    <Card style={{ flex: 1, padding: 14, justifyContent: 'center', gap: 6, backgroundColor: colors.navy, borderColor: colors.navy }}>
                      <T v="small" color={overlay.onDark}>{label}</T>
                      <T v="h3" color={colors.white}>{back}</T>
                    </Card>
                  </Pressable>
                }
              />
            ))}
          </View>

          <SectionTitle title="Overview" />
          <Segmented value={chart} onChange={(k) => setChart(k as 'revenue' | 'bookings' | 'rooms')} options={[['revenue', 'Revenue'], ['bookings', 'Bookings'], ['rooms', 'Rooms']]} />
          <Card style={{ gap: 18 }}>
            {chart === 'revenue' ? <BarChart data={data.charts.monthlyRevenue} format={(n) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))} /> : null}
            {chart === 'bookings' ? (
              <>
                <T v="small" style={{ fontWeight: '700' }}>Requests per month</T>
                <BarChart data={data.charts.reservationTrends} color={colors.sage} />
                <T v="small" style={{ fontWeight: '700' }}>By status</T>
                <HBarChart data={data.charts.bookingStats} color={colors.gold} />
              </>
            ) : null}
            {chart === 'rooms' ? <HBarChart data={data.charts.roomOccupancy} color={colors.sage} /> : null}
          </Card>

          <SectionTitle title="Recent bookings" action="See all" onAction={() => router.push('/reservations')} />
          {data.recentBookings.length ? data.recentBookings.map((b) => (
            <BookingCard key={b.id} booking={b} showGuest onPress={() => router.push({ pathname: '/manage/booking/[id]', params: { id: String(b.id) } })} />
          )) : <EmptyState title="No bookings yet" />}
        </>
      ) : null}
    </Screen>
  );
}
