import Constants from 'expo-constants';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '4000';

/**
 * The API runs on the same computer as the Expo dev server, so the phone finds it by reusing the
 * address it already loaded the app from (e.g. 192.168.1.22:8081 -> http://192.168.1.22:4000).
 * No IP address has to be typed anywhere. EXPO_PUBLIC_API_URL is only a fallback (tunnel mode, production).
 */
function detectServerUrl(): string {
  const expoGo = (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig;
  const hostUri = Constants.expoConfig?.hostUri ?? expoGo?.debuggerHost ?? '';
  const host = hostUri.split(':')[0];
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return `http://${host}:${API_PORT}`;
  return process.env.EXPO_PUBLIC_API_URL ?? `http://localhost:${API_PORT}`;
}

export const SERVER_URL = detectServerUrl().replace(/\/+$/, '');
export const API_URL = `${SERVER_URL}/api`;

/** Backend stores image paths like /uploads/rooms/abc.jpg - turn them into a full URL. */
export const imageUrl = (path?: string | null): string | null => (path ? `${SERVER_URL}${path}` : null);

/** true = the login screen is shown every time the app is opened/scanned. Set to false to stay signed in between launches. */
export const REQUIRE_LOGIN_ON_START = true;

export const ROOM_STATUSES = ['Available', 'Reserved', 'Occupied', 'Maintenance', 'Unavailable'] as const;
export const PAYMENT_METHODS = ['Cash', 'GCash', 'BankTransfer'] as const;
