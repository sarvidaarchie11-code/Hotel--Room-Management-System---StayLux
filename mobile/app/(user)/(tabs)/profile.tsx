import React from 'react';
import { ProfileMenu } from '@/components/ProfileMenu';
import { Screen, T } from '@/components/ui';

export default function Profile() {
  return <Screen><T v="h1" style={{ marginBottom: 16 }}>Profile</T><ProfileMenu /></Screen>;
}
