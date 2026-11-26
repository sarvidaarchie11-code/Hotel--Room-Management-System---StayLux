import React from 'react';
import { View } from 'react-native';
import { Img } from './Img';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { Booking } from '@/types';
import { day, money } from '@/utils/format';
import { Badge, Card, Reveal, T } from './ui';
import { PaymentPill } from './PaymentPill';

const PAYING = ['Confirmed', 'CheckedIn', 'CheckedOut', 'Completed'];

export function BookingCard({ booking, onPress, showGuest, index }: { booking: Booking; onPress: () => void; showGuest?: boolean; index?: number }) {
  const uri = imageUrl(booking.room.primaryImage);
  const card = (
    <Card onPress={onPress} style={{ marginBottom: 12, flexDirection: 'row', gap: 12, padding: 12 }}>
      {uri ? <Img uri={uri} style={{ width: 76, height: 76, borderRadius: 14 }} /> : <View style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: colors.navy }} />}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T v="small" numberOfLines={1} style={{ fontWeight: '700', flexShrink: 1 }}>{booking.reference}</T>
          <Badge text={booking.status} />
        </View>
        <T v="h3" numberOfLines={2}>{booking.room.name}</T>
        {showGuest ? <T v="small">{booking.user.fullName}</T> : null}
        <T v="small">{day(booking.checkIn, 'MMM d')} - {day(booking.checkOut, 'MMM d, yyyy')} · {booking.nights}n</T>
        <T v="small" color={colors.navy} style={{ fontWeight: '700' }}>{money(booking.totalAmount)}</T>
        {PAYING.includes(booking.status) || booking.status === 'Pending' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
            <PaymentPill label={booking.paymentStatus} />
            {booking.balance > 0 && booking.status !== 'Pending' ? <T v="small">Balance <T v="small" color={colors.ink} style={{ fontWeight: '700' }}>{money(booking.balance)}</T></T> : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
  return index === undefined ? card : <Reveal index={index}>{card}</Reveal>;
}
