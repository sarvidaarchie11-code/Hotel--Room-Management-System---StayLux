import * as ImagePicker from 'expo-image-picker';

export interface PickedImage { uri: string; name: string; type: string }
const OK = ['image/jpeg', 'image/png', 'image/webp'];

export async function pickImages(multiple: boolean): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo library permission is required to choose pictures.');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 10 : 1,
    quality: 0.8, // also converts HEIC to JPEG on iOS
  });
  if (res.canceled) return [];
  return res.assets.map((a, i) => {
    const type = a.mimeType && OK.includes(a.mimeType) ? a.mimeType : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    return { uri: a.uri, name: `room-${Date.now()}-${i}.${ext}`, type };
  });
}

/** React Native's FormData accepts {uri,name,type} objects for file parts. */
export const filePart = (img: PickedImage) => ({ uri: img.uri, name: img.name, type: img.type }) as unknown as Blob;
