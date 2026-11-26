import React, { useCallback, useEffect, useState } from 'react';
import { SelectPill } from '@/components/Pickers';
import { Alert, Pressable, Switch, View } from 'react-native';
import { Img } from '@/components/Img';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ImagePlus, RefreshCw, Star, Trash2, X } from 'lucide-react-native';
import { colors, fontSizes, overlay } from '@/constants/theme';
import { ROOM_STATUSES, imageUrl } from '@/constants/config';
import { Button, Card, Chip, StickyFooter, ErrorBanner, Header, Input, Loading, Screen, SectionTitle, T, ChipRow } from '@/components/ui';
import { api, errMsg, fieldErrors } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Amenity, Category, Room } from '@/types';
import { PickedImage, filePart, pickImages } from '@/utils/imagePicker';

const EMPTY = { roomNumber: '', name: '', description: '', pricePerNight: '', maxGuests: '2', bedType: '', numberOfBeds: '1', size: '', floor: '1' };

export default function RoomForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const toast = useToast();
  const [roomId, setRoomId] = useState<number | null>(id ? Number(id) : null);
  const [f, setF] = useState(EMPTY);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Available');
  const [featured, setFeatured] = useState(false);
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [existing, setExisting] = useState<Room['images']>([]);
  const [pending, setPending] = useState<PickedImage[]>([]);
  const [pendingPrimary, setPendingPrimary] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const fill = useCallback((r: Room) => {
    setF({ roomNumber: r.roomNumber, name: r.name, description: r.description, pricePerNight: String(r.pricePerNight), maxGuests: String(r.maxGuests), bedType: r.bedType, numberOfBeds: String(r.numberOfBeds), size: r.size, floor: String(r.floor) });
    setCategoryId(r.categoryId); setStatus(r.status); setFeatured(r.featured); setAmenityIds(r.amenities.map((a) => a.id)); setExisting(r.images);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([api.get<{ categories: Category[] }>('/categories'), api.get<{ amenities: Amenity[] }>('/amenities')]);
        setCategories(c.data.categories); setAmenities(a.data.amenities);
        if (id) fill((await api.get<{ room: Room }>(`/rooms/${id}`)).data.room);
        else {
          // auto-numbering: suggest the next free room number (still editable)
          const n = await api.get<{ next: string }>('/admin/rooms/next-number');
          setF((p) => ({ ...p, roomNumber: n.data.next }));
        }
      } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
    })();
  }, [id, fill]);

  // ---- IMAGE UPLOAD events ----
  const addPending = async () => {
    try {
      const picked = await pickImages(true);
      if (picked.length) setPending((p) => [...p, ...picked]);
    } catch (e) { Alert.alert('Photos', errMsg(e)); }
  };
  const removePending = (i: number) => {
    setPending((p) => p.filter((_, idx) => idx !== i));
    setPendingPrimary((cur) => (cur === null ? null : cur === i ? null : cur > i ? cur - 1 : cur));
  };
  const applyRoom = (r: Room) => setExisting(r.images);
  const makePrimary = async (imageId: number) => { try { applyRoom((await api.patch<{ room: Room }>(`/admin/rooms/${roomId}/images/${imageId}/primary`)).data.room); } catch (e) { Alert.alert('Failed', errMsg(e)); } };
  const removeExisting = (imageId: number) => Alert.alert('Remove photo?', 'This deletes the picture from the server.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { try { applyRoom((await api.delete<{ room: Room }>(`/admin/rooms/${roomId}/images/${imageId}`)).data.room); } catch (e) { Alert.alert('Failed', errMsg(e)); } } },
  ]);
  const replaceExisting = async (imageId: number) => {
    try {
      const [img] = await pickImages(false);
      if (!img) return;
      const form = new FormData(); form.append('image', filePart(img));
      applyRoom((await api.put<{ room: Room }>(`/admin/rooms/${roomId}/images/${imageId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.room);
    } catch (e) { Alert.alert('Failed', errMsg(e)); }
  };

  const uploadPending = async (targetId: number) => {
    if (!pending.length) return;
    const form = new FormData();
    pending.forEach((img) => form.append('images', filePart(img)));
    if (pendingPrimary !== null) form.append('primaryIndex', String(pendingPrimary));
    const res = await api.post<{ room: Room }>(`/admin/rooms/${targetId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
    setPending([]); setPendingPrimary(null); applyRoom(res.data.room);
  };

  const save = async () => { // ROOM CREATION / ROOM UPDATE event
    const e: Record<string, string> = {};
    if (!f.roomNumber.trim()) e.roomNumber = 'Room number is required';
    if (f.name.trim().length < 2) e.name = 'Room name is required';
    if (!categoryId) e.categoryId = 'Select a room type';
    if (f.description.trim().length < 10) e.description = 'Add a short description (10+ characters)';
    if (!(Number(f.pricePerNight) > 0)) e.pricePerNight = 'Enter a price above 0';
    if (!(Number(f.maxGuests) >= 1)) e.maxGuests = 'At least 1 guest';
    if (f.bedType.trim().length < 2) e.bedType = 'Bed type is required';
    if (!(Number(f.numberOfBeds) >= 1)) e.numberOfBeds = 'At least 1 bed';
    if (!f.size.trim()) e.size = 'Room size is required';
    if (f.floor === '' || Number.isNaN(Number(f.floor))) e.floor = 'Enter a floor number';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setError('');
    const body = { ...f, categoryId, status, featured, amenityIds, pricePerNight: Number(f.pricePerNight), maxGuests: Number(f.maxGuests), numberOfBeds: Number(f.numberOfBeds), floor: Number(f.floor) };
    let savedId = roomId;
    try {
      if (savedId) await api.put(`/admin/rooms/${savedId}`, body);
      else { savedId = (await api.post<{ room: Room }>('/admin/rooms', body)).data.room.id; setRoomId(savedId); }
    } catch (err) { setError(errMsg(err)); setErrors(fieldErrors(err)); setBusy(false); return; }
    try {
      await uploadPending(savedId);
    } catch (err) {
      setBusy(false);
      setError(`Room saved, but the photos failed to upload: ${errMsg(err)}. Tap Save again to retry the upload.`);
      return;
    }
    setBusy(false);
    toast.show('Room saved - visible to guests'); router.back();
  };

  const toggleAmenity = (aid: number) => setAmenityIds((p) => (p.includes(aid) ? p.filter((x) => x !== aid) : [...p, aid]));

  return (
    <Screen footer={<StickyFooter><Button title={roomId ? 'Save Changes' : 'Create Room'} variant="gold" onPress={save} loading={busy} style={{ flex: 1 }} /></StickyFooter>}>
      <Header title={id ? 'Edit Room' : 'Add Room'} />
      {loading ? <Loading /> : (
        <>
          {error ? <ErrorBanner message={error} /> : null}
          <SectionTitle title="Details" />
          <Input label={id ? 'Room number' : 'Room number (auto-suggested)'} value={f.roomNumber} onChangeText={set('roomNumber')} placeholder="e.g. 301" error={errors.roomNumber} />
          <Input label="Room name" value={f.name} onChangeText={set('name')} placeholder="e.g. Deluxe Garden View" error={errors.name} />
                    <SelectPill label="Room type" value={categoryId ? String(categoryId) : ''} onChange={(k) => setCategoryId(Number(k))} options={categories.map((c) => [String(c.id), c.name] as [string, string])} placeholder="Choose a type" />
          {errors.categoryId ? <T v="small" color={colors.danger} style={{ marginBottom: 8 }}>{errors.categoryId}</T> : null}
          <Input label="Description" value={f.description} onChangeText={set('description')} multiline placeholder="Describe the room…" error={errors.description} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input filter="decimal" label="Price / night (₱)" value={f.pricePerNight} onChangeText={set('pricePerNight')} keyboardType="decimal-pad" error={errors.pricePerNight} /></View>
            <View style={{ flex: 1 }}><Input filter="digits" label="Max guests" value={f.maxGuests} onChangeText={set('maxGuests')} keyboardType="number-pad" error={errors.maxGuests} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}><Input label="Bed type" value={f.bedType} onChangeText={set('bedType')} placeholder="King, Twin…" error={errors.bedType} /></View>
            <View style={{ flex: 1 }}><Input filter="digits" label="No. of beds" value={f.numberOfBeds} onChangeText={set('numberOfBeds')} keyboardType="number-pad" error={errors.numberOfBeds} /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Input label="Room size" value={f.size} onChangeText={set('size')} placeholder="32 sqm" error={errors.size} /></View>
            <View style={{ flex: 1 }}><Input filter="digits" label="Floor" value={f.floor} onChangeText={set('floor')} keyboardType="number-pad" error={errors.floor} /></View>
          </View>

                    <SelectPill label="Status" value={status} onChange={setStatus} options={ROOM_STATUSES.map((s) => [s, s] as [string, string])} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 }}>
            <T v="h3">Show on guest home</T>
            <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: colors.gold, false: colors.line }} thumbColor={colors.white} />
          </View>

          <SectionTitle title="Amenities" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{amenities.map((a) => <Chip key={a.id} text={a.name} active={amenityIds.includes(a.id)} onPress={() => toggleAmenity(a.id)} />)}</View>

          <SectionTitle title="Photos" />
          {existing.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {existing.map((img) => (
                <Card key={img.id} style={{ width: '47%', padding: 8 }}>
                  <Img uri={imageUrl(img.path)!} style={{ width: '100%', height: 110, borderRadius: 12 }} />
                  {img.isPrimary ? <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}><T v="small" color={colors.navy} style={{ fontWeight: '800', fontSize: fontSizes.tiny }}>PRIMARY</T></View> : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                    <Pressable hitSlop={8} accessibilityLabel="Set as main photo" onPress={() => makePrimary(img.id)}><Star size={20} color={img.isPrimary ? colors.gold : colors.muted} fill={img.isPrimary ? colors.gold : 'none'} /></Pressable>
                    <Pressable hitSlop={8} accessibilityLabel="Replace photo" onPress={() => replaceExisting(img.id)}><RefreshCw size={20} color={colors.sage} /></Pressable>
                    <Pressable hitSlop={8} accessibilityLabel="Remove photo" onPress={() => removeExisting(img.id)}><Trash2 size={20} color={colors.danger} /></Pressable>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}
          {pending.length ? (
            <>
              <T v="label" style={{ marginBottom: 8 }}>New photos (uploaded when you save)</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                {pending.map((img, i) => (
                  <View key={img.uri} style={{ width: '47%' }}>
                    <Img uri={img.uri} style={{ width: '100%', height: 110, borderRadius: 12 }} />
                    <Pressable onPress={() => removePending(i)} style={{ position: 'absolute', top: 6, right: 6, backgroundColor: overlay.dark, borderRadius: 12, padding: 4 }}><X size={14} color={colors.white} /></Pressable>
                    <Pressable onPress={() => setPendingPrimary(i)} style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: pendingPrimary === i ? colors.gold : overlay.whiteChip, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      <Star size={12} color={colors.navy} fill={pendingPrimary === i ? colors.navy : 'none'} /><T v="small" color={colors.navy} style={{ fontSize: fontSizes.tiny, fontWeight: '700' }}>{pendingPrimary === i ? 'Primary' : 'Set primary'}</T>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          <Button title="Add photos" variant="outline" icon={<ImagePlus size={18} color={colors.navy} />} onPress={addPending} />
          <T v="small" style={{ marginTop: 6 }}>JPG, PNG or WEBP, max 5 MB. Star = main photo.</T>

        </>
      )}
    </Screen>
  );
}
