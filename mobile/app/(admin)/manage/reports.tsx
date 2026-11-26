import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { FileSpreadsheet, Printer, Share2 } from 'lucide-react-native';
import { format, subDays } from 'date-fns';
import { colors, overlay } from '@/constants/theme';
import { HBarChart } from '@/components/BarChart';
import { Button, Card, Chip, ErrorBanner, Header, Loading, Row, Screen, SectionTitle, T, ChipRow } from '@/components/ui';
import { Segmented } from '@/components/Pickers';
import { useLoad } from '@/hooks/useLoad';
import { api } from '@/services/api';
import { Report } from '@/types';
import { label, money } from '@/utils/format';
import { printReport, shareReportCsv, shareReportPdf } from '@/utils/receipt';
import { errMsg } from '@/services/api';

const RANGES = [['7 days', 7], ['30 days', 30], ['90 days', 90], ['1 year', 365]] as const;

export default function Reports() {
  const [days, setDays] = useState<number>(30);
  const { data, loading, error, refreshing, onRefresh, reload } = useLoad(
    () => api.get<Report>('/admin/reports', { params: { from: format(subDays(new Date(), days), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') } }).then((r) => r.data),
    ['payment', 'booking'],
  );
  const pick = (d: number) => { setDays(d); setTimeout(() => { void reload(); }, 0); };
  const rangeLabel = `Last ${days} days (to ${format(new Date(), 'MMM d, yyyy')})`;
  const exportAs = async (kind: 'print' | 'pdf' | 'csv') => {
    if (!data) return;
    try { if (kind === 'print') await printReport(data, rangeLabel, 'StayLux'); else if (kind === 'pdf') await shareReportPdf(data, rangeLabel, 'StayLux'); else await shareReportCsv(data, rangeLabel); } catch (e) { Alert.alert('Export failed', errMsg(e)); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Reports" />
      <Segmented value={String(days)} onChange={(k) => pick(Number(k))} options={RANGES.map(([l, d]) => [String(d), l] as [string, string])} />
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {loading ? <Loading /> : data ? (
        <>
          <View style={{ backgroundColor: colors.navy, borderRadius: 24, padding: 20 }}>
            <T v="small" color={overlay.onDark}>Revenue collected</T>
            <T v="display" color={colors.gold}>{money(data.totalCollected)}</T>
            <T v="small" color={overlay.onDark}>{data.paymentCount} verified {data.paymentCount === 1 ? 'payment' : 'payments'}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Button title="Print" small variant="outline" icon={<Printer size={15} color={colors.navy} />} onPress={() => exportAs('print')} style={{ flex: 1 }} />
            <Button title="PDF" small variant="outline" icon={<Share2 size={15} color={colors.navy} />} onPress={() => exportAs('pdf')} style={{ flex: 1 }} />
            <Button title="CSV" small variant="outline" icon={<FileSpreadsheet size={15} color={colors.navy} />} onPress={() => exportAs('csv')} style={{ flex: 1 }} />
          </View>
          <SectionTitle title="Bookings" />
          <Card>
            <Row label="Requests received" value={String(data.totalBookings)} />
            <Row label="Nights booked" value={String(data.nightsBooked)} />
            <Row label="Booked value" value={money(data.bookedValue)} />
          </Card>
          <SectionTitle title="By status" />
          <Card><HBarChart data={data.byStatus.map((p) => ({ ...p, label: label(p.label) }))} color={colors.gold} /></Card>
          <SectionTitle title="By payment method" />
          <Card>{data.byMethod.length ? data.byMethod.map((m) => <Row key={m.label} label={label(m.label)} value={money(m.value)} />) : <T v="small">No verified payments yet.</T>}</Card>
          <SectionTitle title="Top rooms" />
          <Card>{data.topRooms.length ? data.topRooms.map((r) => <Row key={r.roomNumber} label={`Room ${r.roomNumber} · ${r.name} (${r.nights}n)`} value={money(r.booked)} />) : <T v="small">No accepted bookings yet.</T>}</Card>
        </>
      ) : null}
    </Screen>
  );
}
