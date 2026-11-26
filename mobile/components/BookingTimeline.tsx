import React from 'react';
import { View } from 'react-native';
import { BedDouble, Check, CheckCircle2, Hourglass, Sparkles, Wallet, X } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Booking } from '@/types';
import { day, money, stamp } from '@/utils/format';
import { Card, T } from './ui';

const REACHED: Record<string, number> = { Pending: 0, Confirmed: 1, CheckedIn: 2, CheckedOut: 3, Completed: 3 };

function describe(b: Booking, admin: boolean) {
  const depositOpen = b.depositAmount > 0 && b.depositRemaining > 0 && !!b.depositDueAt;
  switch (b.status) {
    case 'Pending':
      return admin
        ? { Icon: Hourglass, tone: colors.gold, title: 'Needs your decision', text: 'Approve to reserve the room, or reject with a reason. The guest is notified either way.' }
        : { Icon: Hourglass, tone: colors.gold, title: 'Waiting for approval', text: "The hotel is reviewing your request. We'll notify you as soon as it is decided. No payment is needed yet." };
    case 'Confirmed':
      if (depositOpen) {
        return admin
          ? { Icon: Wallet, tone: colors.gold, title: 'Waiting for deposit', text: `Guest owes ${money(b.depositRemaining)} by ${stamp(b.depositDueAt!)}. The booking is cancelled automatically if it is not received.` }
          : { Icon: Wallet, tone: colors.gold, title: 'Approved - deposit needed', text: `Pay ${money(b.depositRemaining)} by ${stamp(b.depositDueAt!)} to keep your reservation.` };
      }
      return { Icon: CheckCircle2, tone: colors.sage, title: 'Reservation confirmed', text: `Stay starts ${day(b.checkIn, 'EEE, MMM d')}.${b.balance > 0 ? ` Balance ${money(b.balance)} is due at the hotel.` : ''}` };
    case 'CheckedIn':
      return { Icon: BedDouble, tone: colors.sage, title: admin ? 'Guest is in-house' : 'Enjoy your stay', text: `Check-out is ${day(b.checkOut, 'EEE, MMM d')}.${b.balance > 0 ? ` Balance ${money(b.balance)} to settle.` : ''}` };
    case 'CheckedOut':
      return b.balance > 0
        ? { Icon: Wallet, tone: colors.gold, title: 'Balance to settle', text: `${money(b.balance)} is still unpaid.` }
        : { Icon: Sparkles, tone: colors.sage, title: 'Thank you for staying', text: 'Everything is paid. We hope to see you again.' };
    case 'Completed':
      return { Icon: Sparkles, tone: colors.sage, title: 'All done', text: 'Stay completed and fully paid. Thank you!' };
    case 'Rejected':
      return { Icon: X, tone: colors.danger, title: 'Request declined', text: b.rejectionReason ?? 'The hotel could not accept this request.' };
    default:
      return { Icon: X, tone: colors.danger, title: 'Reservation cancelled', text: b.rejectionReason ?? 'This reservation was cancelled.' };
  }
}

/** Plain-language status message plus a progress line: Requested -> Confirmed -> Check-in -> Check-out. */
export function BookingTimeline({ booking, admin = false }: { booking: Booking; admin?: boolean }) {
  const s = booking.status;
  const { Icon, tone, title, text } = describe(booking, admin);
  const closed = s === 'Rejected' || s === 'Cancelled';
  const reached = REACHED[s] ?? 0;
  const steps = [
    { label: 'Requested', sub: day(booking.createdAt, 'MMM d') },
    { label: 'Confirmed', sub: ' ' },
    { label: 'Check-in', sub: day(booking.checkIn, 'MMM d') },
    { label: s === 'Completed' ? 'Completed' : 'Check-out', sub: day(booking.checkOut, 'MMM d') },
  ];
  return (
    <Card style={{ paddingVertical: 16, paddingHorizontal: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: closed ? colors.dangerSoft : colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} color={tone} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3" color={closed ? colors.danger : colors.navy}>{title}</T>
          <T v="small" style={{ marginTop: 2 }}>{text}</T>
        </View>
      </View>
      {closed ? null : (
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          {steps.map((st, i) => {
            const done = i <= reached;
            const current = i === reached;
            return (
              <View key={st.label} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? 'transparent' : done ? colors.navy : colors.line }} />
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? colors.navy : colors.white, borderWidth: 2, borderColor: current ? colors.gold : done ? colors.navy : colors.line, alignItems: 'center', justifyContent: 'center' }}>
                    {done ? <Check size={14} color={colors.white} /> : null}
                  </View>
                  <View style={{ flex: 1, height: 2, backgroundColor: i === steps.length - 1 ? 'transparent' : i < reached ? colors.navy : colors.line }} />
                </View>
                <T v="small" color={done ? colors.navy : colors.muted} style={{ marginTop: 8, fontWeight: done ? '700' : '500', fontSize: 12 }}>{st.label}</T>
                <T v="small" style={{ fontSize: 11 }}>{st.sub}</T>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
