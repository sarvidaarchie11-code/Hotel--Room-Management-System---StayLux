import React from 'react';
import { View } from 'react-native';
import { colors } from '@/constants/theme';
import { Booking } from '@/types';
import { money, stamp } from '@/utils/format';
import { PaymentPill } from './PaymentPill';
import { Card, T } from './ui';

function Stat({ label, value, strong, divider }: { label: string; value: string; strong?: boolean; divider?: boolean }) {
  return (
    <View style={{ flex: 1, paddingLeft: divider ? 14 : 0, borderLeftWidth: divider ? 1 : 0, borderLeftColor: colors.line }}>
      <T v="small">{label}</T>
      <T v="h2" color={strong ? colors.navy : colors.ink} style={{ fontWeight: strong ? '800' : '600' }}>{value}</T>
    </View>
  );
}

/** Total / Paid / Balance at a glance, the payment label, and the deposit deadline when one is open. */
export function PaymentSummary({ booking: b, children }: { booking: Booking; children?: React.ReactNode }) {
  const depositOpen = b.status === 'Confirmed' && b.depositAmount > 0 && b.depositRemaining > 0 && !!b.depositDueAt;
  const waiting = b.payments.filter((p) => p.status === 'Submitted').reduce((n, p) => n + p.amount, 0);
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T v="small" style={{ fontWeight: '700', letterSpacing: 0.6 }}>PAYMENT</T>
        <PaymentPill label={b.paymentStatus} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Stat label="Total" value={money(b.totalAmount)} />
        <Stat label="Paid" value={money(b.paidAmount)} divider />
        <Stat label="Balance" value={money(b.balance)} strong divider />
      </View>
      {b.status === 'Pending' ? (
        <View style={{ backgroundColor: colors.goldSoft, borderRadius: 12, padding: 12, marginTop: 14 }}>
          <T v="small" color={colors.navy}>Payment opens after the hotel approves your request.</T>
        </View>
      ) : null}
      {waiting > 0 ? (
        <View style={{ backgroundColor: colors.navySoft, borderRadius: 12, padding: 12, marginTop: 14 }}>
          <T v="small" color={colors.navy}><T v="small" color={colors.navy} style={{ fontWeight: '800' }}>{money(waiting)}</T> is waiting for the hotel to verify. Your balance updates once it is confirmed.</T>
        </View>
      ) : null}
      {depositOpen ? (
        <View style={{ backgroundColor: colors.goldSoft, borderRadius: 12, padding: 12, marginTop: 14 }}>
          <T v="small" color={colors.navy}><T v="small" color={colors.navy} style={{ fontWeight: '800' }}>Deposit {money(b.depositRemaining)}</T> due by {stamp(b.depositDueAt!)}. The reservation is cancelled automatically if it is not received.</T>
        </View>
      ) : null}
      {children}
    </Card>
  );
}
