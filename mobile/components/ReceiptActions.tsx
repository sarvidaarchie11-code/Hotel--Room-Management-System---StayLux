import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Printer, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Button } from '@/components/ui';
import { api, errMsg } from '@/services/api';
import { Booking, HotelSettings } from '@/types';
import { printBookingReceipt, shareBookingReceipt } from '@/utils/receipt';

/** Print the receipt (system print dialog) or share it as a PDF. */
export function ReceiptActions({ booking }: { booking: Booking }) {
  const [busy, setBusy] = useState<'print' | 'share' | null>(null);
  const run = async (kind: 'print' | 'share') => {
    setBusy(kind);
    try {
      const settings = await api.get<{ settings: HotelSettings }>('/settings').then((r) => r.data.settings).catch(() => null);
      if (kind === 'print') await printBookingReceipt(booking, settings);
      else await shareBookingReceipt(booking, settings);
    } catch (e) {
      Alert.alert(kind === 'print' ? 'Could not print' : 'Could not share', `${errMsg(e)}\n\nIf this keeps happening, run: npx expo install expo-print expo-sharing`);
    } finally { setBusy(null); }
  };
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
      <Button title="Print" variant="outline" small loading={busy === 'print'} icon={<Printer size={16} color={colors.navy} />} onPress={() => void run('print')} style={{ flex: 1 }} />
      <Button title="Share PDF" variant="outline" small loading={busy === 'share'} icon={<Share2 size={16} color={colors.navy} />} onPress={() => void run('share')} style={{ flex: 1 }} />
    </View>
  );
}
