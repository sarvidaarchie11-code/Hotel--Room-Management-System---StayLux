import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { colors, fontSizes } from '@/constants/theme';
import { BlockedRange, DateRangePicker } from '@/components/DateRangePicker';
import { useToast } from '@/components/Toast';
import { Button, Card, ErrorBanner, Header, Input, Loading, Row, Screen, StickyFooter, T } from '@/components/ui';
import { useLoad } from '@/hooks/useLoad';
import { api, errMsg } from '@/services/api';
import { Booking, Room } from '@/types';
import { day, money } from '@/utils/format';

interface Quote { available: boolean; nights: number; pricePerNight: number; subtotal: number; discountPercent: number; discountAmount: number; offerTitle: string | null; total: number }
const STEPS = ['Dates', 'Guests', 'Review'];

export default function BookRoom() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data, loading, error } = useLoad(() => api.get<{ room: Room; bookedRanges: BlockedRange[] }>(`/rooms/${roomId}`).then((r) => r.data), ['booking'], `room-book-${roomId}`);
  const [step, setStep] = useState(0);
  const [dates, setDates] = useState<{ ci: string | null; co: string | null }>({ ci: null, co: null });
  const [guests, setGuests] = useState(1);
  const [requests, setRequests] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const room = data?.room;

  // AVAILABILITY CHECK event: runs every time the chosen dates change
  const check = useCallback(async (ci: string, co: string) => {
    setChecking(true); setFormError('');
    try {
      const r = await api.get<Quote>(`/rooms/${roomId}/availability`, { params: { checkIn: ci, checkOut: co } });
      setQuote(r.data);
      if (!r.data.available) setFormError('This room is not available for those dates. Please pick other dates.');
    } catch (e) { setQuote(null); setFormError(errMsg(e)); } finally { setChecking(false); }
  }, [roomId]);

  useEffect(() => {
    setQuote(null);
    if (dates.ci && dates.co) void check(dates.ci, dates.co);
  }, [dates, check]);

  const submit = async () => { // BOOKING SUBMISSION event
    if (!room || !dates.ci || !dates.co) return;
    setBusy(true); setFormError('');
    try {
      const { data: res } = await api.post<{ booking: Booking }>('/bookings', { roomId: room.id, checkIn: dates.ci, checkOut: dates.co, guests, specialRequests: requests || undefined });
      toast.show('Request sent. Waiting for the hotel\'s approval.');
      router.replace({ pathname: '/booking/[id]', params: { id: String(res.booking.id) } });
    } catch (e) { setFormError(errMsg(e)); setStep(0); } finally { setBusy(false); }
  };

  const canNext = step === 0 ? !!quote?.available : true;
  const goBack = () => (step === 0 ? router.back() : setStep(step - 1));
  const goNext = () => (step < 2 ? setStep(step + 1) : void submit());

  const footer = room ? (
    <StickyFooter>
      <View style={{ flex: 1 }}>
        <T v="small">{step === 2 ? 'Total' : quote?.available ? `${quote.nights} night${quote.nights === 1 ? '' : 's'}` : 'Total'}</T>
        <T v="h2">{quote?.available ? money(quote.total) : '—'}</T>
      </View>
      <Button title={step === 0 ? 'Cancel' : 'Back'} variant="outline" onPress={goBack} style={{ paddingHorizontal: 20 }} />
      <Button title={step === 2 ? 'Submit' : 'Next'} variant="gold" disabled={!canNext} loading={busy} onPress={goNext} style={{ paddingHorizontal: 26 }} />
    </StickyFooter>
  ) : null;

  return (
    <Screen footer={footer}>
      <Header title="Reserve a room" />
      {loading ? <Loading /> : error || !room ? <ErrorBanner message={error ?? 'Room not found'} /> : (
        <>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
            {STEPS.map((l, i) => (
              <View key={l} style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.gold : colors.line }} />
                <T v="small" color={i === step ? colors.navy : colors.muted} style={{ fontWeight: i === step ? '800' : '500', fontSize: fontSizes.caption }}>{i + 1}. {l}</T>
              </View>
            ))}
          </View>

          <T v="h1">{room.name}</T>
          <T v="small" style={{ marginBottom: 14 }}>{room.category.name} · {money(room.pricePerNight)} per night</T>
          {formError ? <ErrorBanner message={formError} /> : null}

          {step === 0 ? (
            <>
              <DateRangePicker checkIn={dates.ci} checkOut={dates.co} blocked={data?.bookedRanges ?? []} onChange={(ci, co) => setDates({ ci, co })} />
              <T v="small" style={{ marginTop: 10 }}>{!dates.ci ? 'Tap your check-in date.' : !dates.co ? 'Now tap your check-out date.' : checking ? 'Checking availability…' : `${day(dates.ci)} → ${day(dates.co)}`}</T>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View><T v="h3">Guests</T><T v="small">Up to {room.maxGuests}</T></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Button title="" small variant="outline" icon={<Minus size={16} color={colors.navy} />} onPress={() => setGuests((g) => Math.max(1, g - 1))} style={{ paddingHorizontal: 12 }} />
                  <T v="h2">{guests}</T>
                  <Button title="" small variant="outline" icon={<Plus size={16} color={colors.navy} />} onPress={() => setGuests((g) => Math.min(room.maxGuests, g + 1))} style={{ paddingHorizontal: 12 }} />
                </View>
              </Card>
              <Input label="Special requests (optional)" value={requests} onChangeText={setRequests} placeholder="Early check-in, extra pillows…" multiline />
            </>
          ) : null}

          {step === 2 && quote?.available && dates.ci && dates.co ? (
            <Card>
              <Row label="Check-in" value={day(dates.ci, 'EEE, MMM d, yyyy')} />
              <Row label="Check-out" value={day(dates.co, 'EEE, MMM d, yyyy')} />
              <Row label="Guests" value={String(guests)} />
              <Row label={`${money(quote.pricePerNight)} × ${quote.nights} night${quote.nights === 1 ? '' : 's'}`} value={money(quote.subtotal)} />
              {quote.discountAmount > 0 ? <Row label={`${quote.offerTitle ?? 'Special offer'} (${quote.discountPercent}% off)`} value={`-${money(quote.discountAmount)}`} /> : null}
              <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 6 }} />
              <Row label="Total" value={money(quote.total)} bold />
              {requests ? <Row label="Requests" value={requests} /> : null}
              <T v="small" style={{ marginTop: 8 }}>No payment now. The hotel confirms your request first.</T>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
