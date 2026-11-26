import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ImagePlus, X } from 'lucide-react-native';
import { colors, overlay } from '@/constants/theme';
import { PAYMENT_METHODS, imageUrl } from '@/constants/config';
import { Img } from '@/components/Img';
import { PaymentRow } from '@/components/PaymentRow';
import { BookingTimeline } from '@/components/BookingTimeline';
import { PaymentSummary } from '@/components/PaymentSummary';
import { StarRating } from '@/components/StarRating';
import { Badge, Button, Card, Chip, ErrorBanner, Header, Input, Loading, Row, Screen, SectionTitle, T, ChipRow } from '@/components/ui';
import { Segmented } from '@/components/Pickers';
import { useLoad } from '@/hooks/useLoad';
import { api, errMsg } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Booking, HotelSettings, PaymentMethod, Review } from '@/types';
import { day, label, money, stamp } from '@/utils/format';
import { PickedImage, filePart, pickImages } from '@/utils/imagePicker';
import { ReceiptActions } from '@/components/ReceiptActions';

const PAYABLE = ['Confirmed', 'CheckedIn', 'CheckedOut']; // payments open once the hotel approves

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { data, loading, error, refreshing, onRefresh, reload } = useLoad(async () => {
    const [b, s] = await Promise.all([api.get<{ booking: Booking }>(`/bookings/${id}`), api.get<{ settings: HotelSettings }>('/settings')]);
    const stayDone = ['CheckedOut', 'Completed'].includes(b.data.booking.status);
    const rv = stayDone ? await api.get<{ review: Review | null }>(`/bookings/${id}/review`) : null;
    return { booking: b.data.booking, settings: s.data.settings, review: rv?.data.review ?? null };
  }, ['booking', 'payment', 'settings'], `booking-${id}`);
  const [method, setMethod] = useState<PaymentMethod>('GCash');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const b = data?.booking;
  const st = data?.settings;
  const hoursLeft = b ? (new Date(b.checkIn.slice(0, 10) + 'T00:00:00Z').getTime() - Date.now()) / 3_600_000 : 0;
  const canCancel = !!b && (b.status === 'Pending' || (b.status === 'Confirmed' && hoursLeft >= 24));

  const cancel = () => Alert.alert('Cancel reservation?', 'This cannot be undone.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Cancel booking', style: 'destructive', onPress: async () => { // BOOKING CANCELLATION event
      try { await api.post(`/bookings/${id}/cancel`); await reload(); } catch (e) { Alert.alert('Could not cancel', errMsg(e)); }
    } },
  ]);

  const pickProof = async () => {
    try { const [img] = await pickImages(false); if (img) setProof(img); } catch (e) { Alert.alert('Photos', errMsg(e)); }
  };

  const pay = async () => {
    const value = Number(amount || (b && b.depositRemaining > 0 ? b.depositRemaining : b?.balance));
    if (!value || value <= 0) return setFormError('Enter the amount you paid');
    setBusy(true); setFormError('');
    try {
      const form = new FormData();
      form.append('amount', String(value));
      form.append('method', method);
      if (ref) form.append('transactionRef', ref);
      if (note) form.append('note', note);
      if (proof) form.append('proof', filePart(proof)); // IMAGE UPLOAD event (receipt screenshot)
      await api.post(`/bookings/${id}/payments`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      setAmount(''); setRef(''); setNote(''); setProof(null);
      toast.show('Payment sent for verification');
      await reload();
    } catch (e) { setFormError(errMsg(e)); } finally { setBusy(false); }
  };

  const submitReview = async () => {
    if (!stars) return Alert.alert('Rating', 'Tap the stars to choose a rating.');
    setRating(true);
    try { await api.post(`/bookings/${id}/review`, { rating: stars, comment: comment || undefined }); await reload(); } catch (e) { Alert.alert('Could not submit', errMsg(e)); } finally { setRating(false); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Booking details" />
      {loading ? <Loading /> : error || !b ? <ErrorBanner message={error ?? 'Booking not found'} /> : (
        <>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {imageUrl(b.room.primaryImage) ? <Img uri={imageUrl(b.room.primaryImage)!} style={{ width: '100%', height: 150 }} /> : null}
            <View style={{ padding: 16, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T v="small" style={{ fontWeight: '700' }}>{b.reference}</T><Badge text={b.status} /></View>
              <T v="h2">{b.room.name}</T>
              <T v="small">Booked {stamp(b.createdAt)}</T>
            </View>
          </Card>
          <View style={{ height: 12 }} />
          <BookingTimeline booking={b} />

          <SectionTitle title="Your stay" />
          <Card>
            <Row label="Check-in" value={`${day(b.checkIn, 'EEE, MMM d, yyyy')}${st ? ` · ${st.checkInTime}` : ''}`} />
            <Row label="Check-out" value={`${day(b.checkOut, 'EEE, MMM d, yyyy')}${st ? ` · ${st.checkOutTime}` : ''}`} />
            <Row label="Guests" value={String(b.guests)} />
            <Row label="Nights" value={String(b.nights)} />
            <Row label="Price per night" value={money(b.pricePerNight)} />
            {b.discountAmount > 0 ? <Row label={`${b.offerTitle ?? 'Special offer'} (${b.discountPercent}% off)`} value={`-${money(b.discountAmount)}`} /> : null}
            <Row label="Total" value={money(b.totalAmount)} bold />
            {b.specialRequests ? <Row label="Requests" value={b.specialRequests} /> : null}
          </Card>
          {!['Pending', 'Rejected', 'Cancelled'].includes(b.status) ? <ReceiptActions booking={b} /> : null}

          <SectionTitle title="Payment" />
          <PaymentSummary booking={b}>
            {b.payments.map((p) => <PaymentRow key={p.id} payment={p} />)}
          </PaymentSummary>

          {PAYABLE.includes(b.status) && b.balance > 0 && !showPay ? (
            <Button title={`Pay now · ${money(b.depositRemaining > 0 ? b.depositRemaining : b.balance)}`} variant="gold" onPress={() => setShowPay(true)} style={{ marginTop: 14 }} />
          ) : null}
          {PAYABLE.includes(b.status) && b.balance > 0 && showPay ? (
            <>
              <SectionTitle title="Pay for this booking" />
              <Card>
                {st && (st.gcashNumber || st.bankDetails) ? (
                  <View style={{ backgroundColor: colors.goldSoft, borderRadius: 14, padding: 12, marginBottom: 12, gap: 2 }}>
                    <T v="label" color={colors.navy}>Where to pay</T>
                    {st.gcashNumber ? <T v="small" color={colors.navy}>GCash: {st.gcashNumber}{st.gcashName ? ` (${st.gcashName})` : ''}</T> : null}
                    {st.bankDetails ? <T v="small" color={colors.navy}>Bank: {st.bankDetails}</T> : null}
                    <T v="small" color={colors.navy}>Cash is paid at the front desk.</T>
                  </View>
                ) : null}
                <T v="small" style={{ marginBottom: 8 }}>The hotel verifies it before it counts as paid.</T>
                <Segmented value={method} onChange={(k) => setMethod(k as PaymentMethod)} options={PAYMENT_METHODS.map((m) => [m, label(m)] as [string, string])} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                  {b.depositRemaining > 0 ? <Chip text={`Deposit ${money(b.depositRemaining)}`} onPress={() => setAmount(String(b.depositRemaining))} /> : null}
                  <Chip text={`Full balance ${money(b.balance)}`} onPress={() => setAmount(String(b.balance))} />
                </View>
                <Input filter="decimal" label="Amount paid" value={amount} onChangeText={setAmount} placeholder={String(b.depositRemaining > 0 ? b.depositRemaining : b.balance)} keyboardType="decimal-pad" />
                {method !== 'Cash' ? <Input label="Reference number" value={ref} onChangeText={setRef} placeholder="From your GCash or bank receipt" autoCapitalize="characters" /> : null}
                <Input label="Note (optional)" value={note} onChangeText={setNote} />
                {proof ? (
                  <View style={{ marginBottom: 12 }}>
                    <Img uri={proof.uri} style={{ width: '100%', height: 180, borderRadius: 14 }} />
                    <Pressable onPress={() => setProof(null)} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: overlay.dark, borderRadius: 14, padding: 6 }}><X size={16} color={colors.white} /></Pressable>
                  </View>
                ) : (
                  <Button title="Add receipt photo" variant="outline" small icon={<ImagePlus size={16} color={colors.navy} />} onPress={pickProof} style={{ marginBottom: 12 }} />
                )}
                {formError ? <ErrorBanner message={formError} /> : null}
                <Button title="Submit payment" variant="gold" onPress={pay} loading={busy} />
              </Card>
            </>
          ) : null}

          {['CheckedOut', 'Completed'].includes(b.status) ? (
            <>
              <SectionTitle title="Your review" />
              <Card>
                {data?.review ? (
                  <View style={{ gap: 6 }}>
                    <StarRating value={data.review.rating} size={22} />
                    {data.review.comment ? <T v="body">{data.review.comment}</T> : null}
                    <T v="small">Thanks for rating your stay.</T>
                  </View>
                ) : (
                  <>
                    <T v="small" style={{ marginBottom: 8 }}>How was your stay?</T>
                    <StarRating value={stars} onChange={setStars} size={30} />
                    <View style={{ height: 12 }} />
                    <Input value={comment} onChangeText={setComment} placeholder="Share a few words (optional)" multiline />
                    <Button title="Submit Review" variant="gold" onPress={submitReview} loading={rating} />
                  </>
                )}
              </Card>
            </>
          ) : null}

          {canCancel ? <Button title="Cancel Reservation" variant="danger" onPress={cancel} style={{ marginTop: 20 }} /> : null}
          {b.status === 'Confirmed' && !canCancel ? <T v="small" style={{ marginTop: 14, textAlign: 'center' }}>You can cancel up to 24 hours before check-in.</T> : null}
        </>
      )}
    </Screen>
  );
}
