import React from 'react';
import { Linking, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, radius } from '@/constants/theme';
import { Button, T } from './ui';

export function HotelMap({ latitude, longitude, name, address }: { latitude: number; longitude: number; name: string; address?: string }) {
  const open = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      <MapView style={{ height: 180 }} initialRegion={{ latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }} scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false} onPress={open}>
        <Marker coordinate={{ latitude, longitude }} title={name} />
      </MapView>
      <View style={{ padding: 14, gap: 8 }}>
        {address ? <T v="small">{address}</T> : null}
        <Button title="Open in Maps" variant="outline" small onPress={open} />
      </View>
    </View>
  );
}
