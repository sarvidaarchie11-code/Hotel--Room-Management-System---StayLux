import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { Payment } from '@/types';
import { label, money, stamp } from '@/utils/format';
import { Badge, Button, T } from './ui';
import { Img } from './Img';

export function PaymentRow({ payment: p, onVerify, onReject, showBooking }: { payment: Payment; onVerify?: () => void; onReject?: () => void; showBooking?: boolean }) {
  const [viewer, setViewer] = useState(false);
  const proof = imageUrl(p.proofPath);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 10, gap: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T v="h3" style={{ flexShrink: 1 }}>{money(p.amount)} · {label(p.method)}</T>
        <Badge text={p.status} />
      </View>
      <T v="small">{p.reference}{p.transactionRef ? ` · Ref ${p.transactionRef}` : ''}</T>
      {showBooking && p.booking ? <T v="small">{p.booking.user.fullName} · {p.booking.reference} · {p.booking.room.name}</T> : null}
      <T v="small">{stamp(p.paidAt)}{p.verifiedBy ? ` · by ${p.verifiedBy.fullName}` : ''}</T>
      {p.note ? <T v="small">Note: {p.note}</T> : null}
      {proof ? (
        <Pressable onPress={() => setViewer(true)} style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Img uri={proof} style={{ width: 56, height: 56, borderRadius: 10 }} />
          <T v="label" color={colors.gold}>View receipt photo</T>
        </Pressable>
      ) : null}
      {p.status === 'Submitted' && onVerify && onReject ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Button title="Verify" small variant="gold" onPress={onVerify} style={{ flex: 1 }} />
          <Button title="Reject" small variant="danger" onPress={onReject} style={{ flex: 1 }} />
        </View>
      ) : null}
      <Modal visible={viewer} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
        <Pressable onPress={() => setViewer(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', padding: 16 }}>
          {proof ? <Img uri={proof} style={{ width: '100%', height: '80%', borderRadius: 12 }} /> : null}
          <T v="small" color={colors.white} style={{ textAlign: 'center', marginTop: 12 }}>Tap anywhere to close</T>
        </Pressable>
      </Modal>
    </View>
  );
}
