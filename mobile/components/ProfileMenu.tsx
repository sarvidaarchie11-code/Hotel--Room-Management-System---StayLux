import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, Heart, KeyRound, LogOut, Settings, UserPen } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { Card, T } from '@/components/ui';
import { Img } from '@/components/Img';
import { useAuth } from '@/contexts/AuthContext';
import { api, errMsg } from '@/services/api';
import { User } from '@/types';
import { filePart, pickImages } from '@/utils/imagePicker';

export function ProfileMenu() {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const initials = (user?.fullName ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const avatar = imageUrl(user?.avatarPath);

  const changePhoto = async () => { // IMAGE UPLOAD event (profile picture)
    try {
      const [img] = await pickImages(false);
      if (!img) return;
      setUploading(true);
      const form = new FormData();
      form.append('avatar', filePart(img));
      const { data } = await api.post<{ user: User }>('/auth/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(data.user);
    } catch (e) { Alert.alert('Profile photo', errMsg(e)); } finally { setUploading(false); }
  };

  const items = [
    ...(user?.role === 'USER' ? [{ icon: Heart, label: 'Saved rooms', go: () => router.push('/saved') }] : []),
    { icon: UserPen, label: 'Edit profile', go: () => router.push('/account/edit-profile') },
    { icon: KeyRound, label: 'Change password', go: () => router.push('/account/change-password') },
    { icon: Settings, label: 'Settings', go: () => router.push('/account/settings') },
  ];
  const confirmLogout = () => Alert.alert('Log out', 'Sign out of this device?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: () => void logout() },
  ]);
  return (
    <>
      <Card style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 16 }}>
        <Pressable onPress={changePhoto} accessibilityLabel="Change profile photo" style={{ marginBottom: 10 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: colors.gold }}>
            {avatar ? <Img uri={avatar} style={{ width: 84, height: 84 }} /> : <T v="h1" color={colors.gold}>{initials}</T>}
            {uploading ? <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(27,39,71,0.6)', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.gold} /></View> : null}
          </View>
          <View style={{ position: 'absolute', right: -2, bottom: -2, backgroundColor: colors.gold, borderRadius: 14, padding: 6 }}><Camera size={14} color={colors.navy} /></View>
        </Pressable>
        <T v="h2">{user?.fullName}</T>
        <T v="small">{user?.email}</T>
        <T v="small">{user?.phone}</T>
      </Card>
      <Card style={{ padding: 4 }}>
        {items.map(({ icon: Icon, label, go }) => (
          <Pressable key={label} onPress={go} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: pressed ? 0.6 : 1 })}>
            <Icon size={20} color={colors.sage} /><T v="h3" style={{ flex: 1 }}>{label}</T><ChevronRight size={18} color={colors.muted} />
          </Pressable>
        ))}
        <Pressable onPress={confirmLogout} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: pressed ? 0.6 : 1 })}>
          <LogOut size={20} color={colors.danger} /><T v="h3" color={colors.danger} style={{ flex: 1 }}>Log out</T>
        </Pressable>
      </Card>
    </>
  );
}
