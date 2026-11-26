import React, { useState } from 'react';
import { FlatList, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, View, useWindowDimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/constants/config';
import { LogoMark } from './Logo';
import { Img } from './Img';
import { T } from './ui';

export function ImageCarousel({ paths, height = 280, width }: { paths: string[]; height?: number; width?: number }) {
  const win = useWindowDimensions();
  const w = width ?? win.width;
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);

  if (!paths.length) {
    return (
      <View style={{ width: w, height, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <LogoMark size={56} />
        <T v="small" color={colors.gold}>No photos uploaded yet</T>
      </View>
    );
  }
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / w));
  return (
    <View>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={paths}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => <Pressable onPress={() => setViewer(true)}><Img uri={imageUrl(item)!} style={{ width: w, height }} /></Pressable>}
      />
      {paths.length > 1 ? (
        <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
          {paths.map((p, i) => (
            <View key={p} style={{ width: i === index ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === index ? colors.gold : 'rgba(255,255,255,0.7)' }} />
          ))}
        </View>
      ) : null}
      <Modal visible={viewer} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
        <View style={{ flex: 1, backgroundColor: colors.black, justifyContent: 'center' }}>
          <FlatList
            data={paths}
            horizontal
            pagingEnabled
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: win.width, offset: win.width * i, index: i })}
            keyExtractor={(p) => `v-${p}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <Img uri={imageUrl(item)!} style={{ width: win.width, height: win.height * 0.7 }} />}
          />
          <Pressable onPress={() => setViewer(false)} hitSlop={12} accessibilityLabel="Close photo" style={{ position: 'absolute', top: 54, right: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <X color={colors.white} size={22} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
