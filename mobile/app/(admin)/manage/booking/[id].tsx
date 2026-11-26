import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';
import { PAYMENT_METHODS } from '@/constants/config';
import { PaymentRow } from '@/components/PaymentRow';
import { BookingTimeline } from '@/components/BookingTimeline';
import { PaymentSummary } from '@/components/PaymentSummary';
import { Badge, Button, Card, Chip, ErrorBanner, Header, Input, Loading, PromptModal, Row, Screen, SectionTitle, T, ChipRow } from '@/components/ui';
import { Segmented } from '@/components/Pickers';
import { useLoad } from '@/hooks/useLoad';
import { api, errMsg } from '@/services/api';
import { Booking, PaymentMethod } from '@/types';
import { day, label, money, stamp } from '@/utils/format';
import { ReceiptActions } from '@/components/ReceiptActions';

export default function AdminBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b, loading, error, refreshing, onRefresh, reload } = useLoad(() => api.get<{ booking: Booking }>(`/bookings/${id}`).then((r) => r.data.booking), ['booking', 'payment']);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');

  const act = async (path: string, body?: object, success?: string) => {
    setBusy(path);
    try { await api.post(`/admin/bookings/${id}/${path}`, body); await reload(); if (success) Alert.alert('Done', success); } catch (e) { Alert.alert('Action failed', errMsg(e)); } finally { setBusy(''); }
  };
  const confirm = (title: string, msg: string, path: string, ok: string) => Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: ok, onPress: () => void act(path) }]);

  const review = async (pid: number, verdict: 'verify' | 'reject') => {
    try { await api.post(`/admin/payments/${pid}/${verdict}`); await reload(); } catch (e) { Alert.alert('Failed', errMsg(e)); }
  };
  const record = async () => {
    const value = Number(amount || b?.balance);
    if (!(value > 0)) return Alert.alert('Amount', 'Enter the amount received.');
    try {
      await api.post(`/admin/bookings/${id}/payments`, { amount: value, method, transactionRef: ref || undefined });
      setAmount(''); setRef(''); await reload();
    } catch (e) { Alert.alert('Failed', errMsg(e)); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Booking" />
      {loading ? <Loading /> : error || !b ? <ErrorBanner message={error ?? 'Not found'} /> : (
        <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T v="small" style={{ fontWeight: '700' }}>{b.reference}</T><Badge text={b.status} /></View>
            <T v="h2" style={{ marginTop: 4 }}>{b.room.name}</T>
            <T v="small">Room {b.room.roomNumber} · {b.room.category.name} · requested {stamp(b.createdAt)}</T>
          </Card>

          <View style={{ height: 12 }} />
          <BookingTimeline booking={b} admin />

          <View style={{ gap: 10, marginTop: 14 }}>
            {b.status === 'Pending' ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Approve" variant="gold" style={{ flex: 1 }} loading={busy === 'approve'} onPress={() => confirm('Approve booking?', 'The room will be reserved and the guest notified.', 'approve', 'Approve')} />
                <Button title="Reject" variant="danger" style={{ flex: 1 }} onPress={() => setRejecting(true)} />
              </View>
            ) : null}
            {b.status === 'Confirmed' ? (
              <>
                <Button title="Check In Guest" variant="gold" loading={busy === 'check-in'} onPress={() => confirm('Check in guest?', 'Room status becomes Occupied.', 'check-in', 'Check in')} />
                <Button title="Cancel Booking" variant="danger" onPress={() => confirm('Cancel booking?', 'The guest will be notified.', 'cancel-by-admin', 'Cancel booking')} />
              </>
            ) : null}
            {b.status === 'CheckedIn' ? <Button title="Check Out Guest" variant="gold" loading={busy === 'check-out'} onPress={() => confirm('Check out guest?', 'Room becomes available again.', 'check-out', 'Check out')} /> : null}
            {b.status === 'CheckedOut' ? <Button title="Mark Completed" variant="gold" loading={busy === 'complete'} onPress={() => void act('complete')} /> : null}
            {b.status === 'CheckedOut' && b.balance > 0 ? <T v="small">Completion needs the balance of {money(b.balance)} to be paid and verified.</T> : null}
          </View>

          <SectionTitle title="Guest" />
          <Card><Row label="Name" value={b.user.fullName} /><Row label="Email" value={b.user.email} /><Row label="Phone" value={b.user.phone} /></Card>

          <SectionTitle title="Stay" />
          <Card>
            <Row label="Check-in" value={day(b.checkIn, 'EEE, MMM d, yyyy')} />
            <Row label="Check-out" value={day(b.checkOut, 'EEE, MMM d, yyyy')} />
            <Row label="Guests" value={String(b.guests)} />
            <Row label="Nights × rate" value={`${b.nights} × ${money(b.pricePerNight)}`} />
            {b.discountAmount > 0 ? <Row label={`${b.offerTitle ?? 'Offer'} (${b.discountPercent}% off)`} value={`-${money(b.discountAmount)}`} /> : null}
            <Row label="Total" value={money(b.totalAmount)} bold />
            {b.specialRequests ? <Row label="Requests" value={b.specialRequests} /> : null}
            {b.rejectionReason ? <Row label="Rejection reason" value={b.rejectionReason} /> : null}
          </Card>

          {!['Pending', 'Rejected', 'Cancelled'].includes(b.status) ? <ReceiptActions booking={b} /> : null}

          <SectionTitle title="Payments" />
          <PaymentSummary booking={b}>
            {b.payments.map((p) => <PaymentRow key={p.id} payment={p} onVerify={() => review(p.id, 'verify')} onReject={() => review(p.id, 'reject')} />)}
          </PaymentSummary>

          {b.balance > 0 && ['Confirmed', 'CheckedIn', 'CheckedOut'].includes(b.status) ? (
            <>
              <SectionTitle title="Record a payment" />
              <Card>
                <T v="small" style={{ marginBottom: 8 }}>For money you already received (e.g. cash at the desk). Saved as verified by you.</T>
                <Segmented value={method} onChange={(k) => setMethod(k as PaymentMethod)} options={PAYMENT_METHODS.map((m) => [m, label(m)] as [string, string])} />
                <Input filter="decimal" label="Amount received" value={amount} onChangeText={setAmount} placeholder={String(b.balance)} keyboardType="decimal-pad" />
                {method !== 'Cash' ? <Input label="Reference number" value={ref} onChangeText={setRef} autoCapitalize="characters" /> : null}
                <Button title="Record Payment" variant="outline" onPress={record} />
              </Card>
            </>
          ) : null}
        </>
      )}
      <PromptModal visible={rejecting} title="Reject this booking" placeholder="Reason shown to the guest" confirmText="Reject" onCancel={() => setRejecting(false)} onSubmit={(reason) => { setRejecting(false); void act('reject', { reason }); }} />
    </Screen>
  );
}
