import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { PaymentLabel } from '@/types';

const TONE: Record<PaymentLabel, { bg: string; fg: string }> = {
  'Awaiting approval': { bg: colors.goldSoft, fg: colors.warnText },
  Unpaid: { bg: colors.dangerSoft, fg: colors.danger },
  'Partly paid': { bg: colors.goldSoft, fg: colors.warnText },
  'Deposit paid': { bg: colors.navySoft, fg: colors.navy },
  'Fully paid': { bg: colors.successSoft, fg: colors.success },
};

/** Small colour-coded label: Unpaid / Partly paid / Deposit paid / Fully paid. */
export function PaymentPill({ label }: { label: PaymentLabel }) {
  const c = TONE[label];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: c.fg, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}
