import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { T } from './ui';

/** StayLux mark: an arched doorway (hotel entrance) framing an "S", inside a gold ring. */
export function LogoMark({ size = 64, color = colors.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="46" stroke={color} strokeWidth="3" fill="none" />
      <Circle cx="50" cy="50" r="40" stroke={color} strokeWidth="0.8" fill="none" opacity={0.6} />
      <Path d="M30 74 V46 A20 20 0 0 1 70 46 V74" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Path d="M61 42 C61 31 39 31 39 43 C39 54 61 53 61 64 C61 76 39 76 39 65" stroke={color} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <Circle cx="50" cy="22" r="2.2" fill={color} />
    </Svg>
  );
}

export function Logo({ size = 64, name = 'STAYLUX', tagline, light = false }: { size?: number; name?: string; tagline?: string; light?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <LogoMark size={size} />
      <T v="h1" color={light ? colors.white : colors.navy} style={{ marginTop: 10, letterSpacing: 6, fontSize: size * 0.34 }}>{name}</T>
      {tagline ? <T v="small" color={light ? colors.gold : colors.muted} style={{ marginTop: 2 }}>{tagline}</T> : null}
    </View>
  );
}
