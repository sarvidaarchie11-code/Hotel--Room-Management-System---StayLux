import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { addDays, format } from 'date-fns';
import { colors } from '@/constants/theme';
import { Button, Card, Header, Input, Screen, SectionTitle, T } from '@/components/ui';
import { useLoad } from '@/hooks/useLoad';
import { api, errMsg, fieldErrors } from '@/services/api';
import { Offer } from '@/types';
import { day } from '@/utils/format';

const blank = () => ({ title: '', description: '', discountPercent: '10', validFrom: format(new Date(), 'yyyy-MM-dd'), validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd') });

export default function Offers() {
  const { data, reload, refreshing, onRefresh } = useLoad(() => api.get<{ offers: Offer[] }>('/admin/offers').then((r) => r.data.offers), ['offer']);
  const [f, setF] = useState(blank());
  const [editId, setEditId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof ReturnType<typeof blank>) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      const body = { ...f, discountPercent: Number(f.discountPercent) || 0, active: true };
      if (editId) await api.put(`/admin/offers/${editId}`, body); else await api.post('/admin/offers', body);
      setF(blank()); setEditId(null); setErrors({}); await reload();
    } catch (e) { setErrors(fieldErrors(e)); Alert.alert('Could not save', errMsg(e)); }
  };
  const toggle = async (o: Offer, active: boolean) => {
    try { await api.put(`/admin/offers/${o.id}`, { ...o, validFrom: o.validFrom.slice(0, 10), validUntil: o.validUntil.slice(0, 10), active }); await reload(); } catch (e) { Alert.alert('Failed', errMsg(e)); }
  };
  const del = (o: Offer) => Alert.alert('Delete offer?', o.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/admin/offers/${o.id}`); await reload(); } catch (e) { Alert.alert('Failed', errMsg(e)); } } }]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Special offers" />
      <Card>
        <T v="h3" style={{ marginBottom: 10 }}>{editId ? 'Edit offer' : 'New offer'}</T>
        <Input label="Title" value={f.title} onChangeText={set('title')} error={errors.title} />
        <Input label="Description" value={f.description} onChangeText={set('description')} error={errors.description} />
        <Input filter="digits" label="Discount %" value={f.discountPercent} onChangeText={set('discountPercent')} keyboardType="number-pad" error={errors.discountPercent} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="Valid from" value={f.validFrom} onChangeText={set('validFrom')} placeholder="yyyy-MM-dd" error={errors.validFrom} /></View>
          <View style={{ flex: 1 }}><Input label="Valid until" value={f.validUntil} onChangeText={set('validUntil')} placeholder="yyyy-MM-dd" error={errors.validUntil} /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title={editId ? 'Save offer' : 'Publish offer'} variant="gold" small onPress={save} />
          {editId ? <Button title="Cancel" variant="ghost" small onPress={() => { setEditId(null); setF(blank()); }} /> : null}
        </View>
        <T v="small" style={{ marginTop: 8 }}>Active offers show on the guest home screen. The largest discount applies automatically when the check-in date falls inside the dates.</T>
      </Card>
      <SectionTitle title="All offers" />
      {data?.map((o) => (
        <Card key={o.id} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}><T v="h3">{o.title} · {o.discountPercent}%</T><T v="small">{day(o.validFrom)} – {day(o.validUntil)}</T></View>
            <Switch value={o.active} onValueChange={(v) => toggle(o, v)} trackColor={{ true: colors.sage, false: colors.line }} thumbColor={colors.white} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Button title="Edit" small variant="outline" onPress={() => { setEditId(o.id); setF({ title: o.title, description: o.description, discountPercent: String(o.discountPercent), validFrom: o.validFrom.slice(0, 10), validUntil: o.validUntil.slice(0, 10) }); }} />
            <Button title="Delete" small variant="danger" onPress={() => del(o)} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
