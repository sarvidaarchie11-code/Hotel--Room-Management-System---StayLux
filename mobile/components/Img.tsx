import React from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

/** Cached image with a short fade-in (expo-image keeps files in memory + disk, so repeat views are instant). */
export function Img({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) {
  return <ExpoImage source={{ uri }} style={style as never} contentFit="cover" transition={160} cachePolicy="memory-disk" recyclingKey={uri} />;
}
