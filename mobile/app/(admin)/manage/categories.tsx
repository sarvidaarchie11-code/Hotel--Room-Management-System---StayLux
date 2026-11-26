import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { colors } from '@/constants/theme';
import { Button, Card, Chip, Header, Input, Screen, SectionTitle, T } from '@/components/ui';
import { useLoad } from '@/hooks/useLoad';
import { api, errMsg } from '@/services/api';
import { Amenity, Category } from '@/types';
import { Pressable } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

export default function Categories() {
  const { data, reload, refreshing, onRefresh } = useLoad(async () => {
    const [c, a] = await Promise.all([api.get<{ categories: Category[] }>('/categories'), api.get<{ amenities: Amenity[] }>('/amenities')]);
    return { categories: c.data.categories, amenities: a.data.amenities };
  }, ['category', 'room']);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [amenity, setAmenity] = useState('');

  const run = async (fn: () => Promise<unknown>) => { try { await fn(); await reload(); } catch (e) { Alert.alert('Failed', errMsg(e)); } };

  const saveCategory = () => {
    if (name.trim().length < 2) return;
    void run(async () => {
      if (editing) await api.put(`/admin/categories/${editing.id}`, { name: name.trim() });
      else await api.post('/admin/categories', { name: name.trim() });
      setName(''); setEditing(null);
    });
  };
  const delCategory = (c: Category) => Alert.alert('Delete room type?', c.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void run(() => api.delete(`/admin/categories/${c.id}`)) }]);
  const addAmenity = () => { if (amenity.trim().length < 2) return; void run(async () => { await api.post('/admin/amenities', { name: amenity.trim() }); setAmenity(''); }); };
  const delAmenity = (a: Amenity) => Alert.alert('Delete amenity?', a.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void run(() => api.delete(`/admin/amenities/${a.id}`)) }]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Room types & amenities" />
      <SectionTitle title="Room types" />
      <Card>
        {data?.categories.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 }}>
            <View style={{ flex: 1 }}><T v="h3">{c.name}</T><T v="small">{c._count?.rooms ?? 0} room(s)</T></View>
            <Pressable hitSlop={8} accessibilityLabel={`Rename ${c.name}`} onPress={() => { setEditing(c); setName(c.name); }}><Pencil size={18} color={colors.sage} /></Pressable>
            <Pressable hitSlop={8} accessibilityLabel={`Delete ${c.name}`} onPress={() => delCategory(c)}><Trash2 size={18} color={colors.danger} /></Pressable>
          </View>
        ))}
        <View style={{ marginTop: 10 }}>
          <Input value={name} onChangeText={setName} placeholder={editing ? 'Rename room type' : 'New room type'} onSubmitEditing={saveCategory} returnKeyType="done" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title={editing ? 'Save name' : 'Add room type'} variant="gold" small onPress={saveCategory} />
            {editing ? <Button title="Cancel" variant="ghost" small onPress={() => { setEditing(null); setName(''); }} /> : null}
          </View>
        </View>
      </Card>

      <SectionTitle title="Amenities" />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{data?.amenities.map((a) => <Chip key={a.id} text={`${a.name}  ✕`} onPress={() => delAmenity(a)} />)}</View>
        <T v="small" style={{ marginBottom: 8 }}>Tap an amenity to delete it.</T>
        <Input value={amenity} onChangeText={setAmenity} placeholder="New amenity" onSubmitEditing={addAmenity} returnKeyType="done" />
        <Button title="Add amenity" variant="gold" small onPress={addAmenity} />
      </Card>
    </Screen>
  );
}
