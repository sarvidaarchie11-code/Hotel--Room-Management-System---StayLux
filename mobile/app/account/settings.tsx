import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Header, Row, Screen, SectionTitle, T } from '@/components/ui';
import { SERVER_URL } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import { api, errMsg } from '@/services/api';
import { useLoad } from '@/hooks/useLoad';
import { HotelSettings } from '@/types';
import { HotelMap } from '@/components/HotelMap';

export default function Settings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data } = useLoad(() => api.get<{ settings: HotelSettings }>('/settings').then((r) => r.data.settings), ['settings']);
  const [status, setStatus] = useState('');

  const test = async () => {
    try { await api.get('/health'); setStatus('Connected to the server'); } catch (e) { setStatus(errMsg(e)); }
  };

  return (
    <Screen>
      <Header title="Settings" />
      <Card>
        <Row label="Signed in as" value={user?.email ?? ''} />
        <Row label="Account type" value={user?.role === 'ADMIN' ? 'Administrator' : 'Guest'} />
        <Row label="Server" value={SERVER_URL} />
        <Button title="Test connection" variant="outline" small onPress={test} style={{ marginTop: 8 }} />
        {status ? <T v="small" style={{ marginTop: 8 }}>{status}</T> : null}
      </Card>
      {data ? (
        <>
          <SectionTitle title="Hotel" />
          <Card>
            <Row label="Name" value={data.name} />
            <Row label="Check-in time" value={data.checkInTime} />
            <Row label="Check-out time" value={data.checkOutTime} />
            {data.phone ? <Row label="Phone" value={data.phone} /> : null}
            {data.address ? <Row label="Address" value={data.address} /> : null}
          </Card>
        </>
      ) : null}
      {data && data.latitude != null && data.longitude != null ? (
        <>
          <SectionTitle title="Location" />
          <HotelMap latitude={data.latitude} longitude={data.longitude} name={data.name} address={data.address} />
        </>
      ) : null}
      <View style={{ gap: 10, marginTop: 22 }}>
        <Button title="Change password" variant="outline" onPress={() => router.push('/account/change-password')} />
        <Button title="Log out" variant="danger" onPress={() => Alert.alert('Log out', 'Sign out of this device?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: () => void logout() }])} />
      </View>
    </Screen>
  );
}
