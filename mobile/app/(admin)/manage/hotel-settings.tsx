import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { View } from 'react-native';
import { Button, ErrorBanner, Header, Input, Loading, Screen, SectionTitle, T } from '@/components/ui';
import { api, errMsg, fieldErrors } from '@/services/api';
import { useToast } from '@/components/Toast';
import { HotelSettings } from '@/types';

export default function HotelSettingsScreen() {
  const toast = useToast();
  type Form = Omit<HotelSettings, 'latitude' | 'longitude' | 'depositPercent' | 'depositHours'> & { latitude: string; longitude: string; depositPercent: string; depositHours: string };
  const [f, setF] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get<{ settings: HotelSettings }>('/settings').then((r) => setF({ ...r.data.settings, latitude: r.data.settings.latitude?.toString() ?? '', longitude: r.data.settings.longitude?.toString() ?? '', depositPercent: String(r.data.settings.depositPercent ?? 50), depositHours: String(r.data.settings.depositHours ?? 24) })).catch((e) => setError(errMsg(e))); }, []);
  const set = (k: keyof Form) => (v: string) => setF((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    if (!f) return;
    setBusy(true); setError('');
    try { await api.put('/admin/settings', { ...f, latitude: f.latitude.trim() === '' ? null : Number(f.latitude), longitude: f.longitude.trim() === '' ? null : Number(f.longitude) }); toast.show('Hotel settings saved'); } catch (e) { setError(errMsg(e)); setErrors(fieldErrors(e)); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <Header title="Hotel settings" />
      {error ? <ErrorBanner message={error} /> : null}
      {!f ? <Loading /> : (
        <>
          <Input label="Hotel name" value={f.name} onChangeText={set('name')} error={errors.name} />
          <Input label="Tagline" value={f.tagline} onChangeText={set('tagline')} />
          <Input label="Address" value={f.address} onChangeText={set('address')} />
          <Input filter="phone" label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" />
          <Input label="Check-in time" value={f.checkInTime} onChangeText={set('checkInTime')} />
          <Input label="Check-out time" value={f.checkOutTime} onChangeText={set('checkOutTime')} />
          <SectionTitle title="Map location" />
          <T v="small" style={{ marginBottom: 10 }}>In Google Maps, press and hold your hotel and copy the two numbers (latitude, longitude). Leave empty to hide the map.</T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input filter="coords" label="Latitude" value={f.latitude} onChangeText={set('latitude')} keyboardType="numbers-and-punctuation" placeholder="11.2543" error={errors.latitude} /></View>
            <View style={{ flex: 1 }}><Input filter="coords" label="Longitude" value={f.longitude} onChangeText={set('longitude')} keyboardType="numbers-and-punctuation" placeholder="124.9611" error={errors.longitude} /></View>
          </View>
          <SectionTitle title="Deposit" />
          <T v="small" style={{ marginBottom: 10 }}>After you approve a booking, the guest pays this share of the total within the hours below, or it is cancelled automatically. 0% means no deposit.</T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input filter="digits" label="Deposit (%)" value={f.depositPercent} onChangeText={set('depositPercent')} keyboardType="number-pad" error={errors.depositPercent} /></View>
            <View style={{ flex: 1 }}><Input filter="digits" label="Hours to pay" value={f.depositHours} onChangeText={set('depositHours')} keyboardType="number-pad" error={errors.depositHours} /></View>
          </View>
          <SectionTitle title="Guest payment details" />
          <Input filter="phone" label="GCash number" value={f.gcashNumber} onChangeText={set('gcashNumber')} keyboardType="phone-pad" />
          <Input filter="letters" label="GCash account name" value={f.gcashName} onChangeText={set('gcashName')} />
          <Input label="Bank transfer details" value={f.bankDetails} onChangeText={set('bankDetails')} multiline />
          <Button title="Save Settings" variant="gold" onPress={save} loading={busy} />
        </>
      )}
    </Screen>
  );
}
