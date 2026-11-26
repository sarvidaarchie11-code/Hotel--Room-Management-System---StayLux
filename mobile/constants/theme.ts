import { Platform } from 'react-native';

// Palette: Midnight Indigo (primary), Rose Gold (accent), Pearl (canvas), Dusty Blue (secondary), Emerald (success)
export const colors = {
  navy: '#1B2747', // midnight indigo - primary buttons, headers, active tab
  gold: '#B8775C', // rose gold - accents and highlights
  ivory: '#F3F2F8', // pearl - screen background
  white: '#FFFFFF',
  sage: '#46608F', // dusty blue - secondary accent, icons, links
  ink: '#131A2E', // body text
  muted: '#667089', // secondary text
  line: '#E3E5EE',
  danger: '#B4443F',
  dangerSoft: '#F7E1DF',
  warn: '#9A6A2B',
  goldSoft: '#F6E6DD',
  sageSoft: '#E1E7F4',
  navySoft: '#E6E9F4',
  success: '#2F7D62',
  successSoft: '#DDF0E8',
  warnText: '#8A4F38', // text on the soft rose/warn tint
  dangerBorder: '#EBC9C5',
  dangerOnDark: '#FF9C92',
  placeholder: '#9AA2B8',
  disabled: '#C3C8D8',
  black: '#000000',
  calDone: '#9096AA', // calendar: checked-out / completed bookings
  calToday: '#F6E9E1',
  calPending: '#E8C9B8',
};

/** Translucent layers used over photos and dark surfaces. */
export const overlay = {
  scrim: 'rgba(19,26,46,0.55)', // behind sheets and modals
  dark: 'rgba(19,26,46,0.8)', // small dark buttons on photos
  onDark: 'rgba(255,255,255,0.7)', // secondary text on indigo
  onDarkStrong: 'rgba(255,255,255,0.85)',
  whiteChip: 'rgba(255,255,255,0.92)', // round buttons on photos
  offerFill: 'rgba(246,230,221,0.88)',
};

/** Type scale used by every screen (sizes in px). Titles are serif, everything else is the system sans. */
export const type = { display: 30, h1: 25, h2: 19, h3: 16, body: 15, small: 13, caption: 12, tiny: 11.5, micro: 10, eyebrow: 14, brand: 26 };
export const fontSizes = type; // same scale, name that cannot clash with local variables
/** Spacing scale: use these multiples everywhere. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  soft: { shadowColor: '#1B2747', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  lift: { shadowColor: '#1B2747', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
};

/** Frosted-glass surfaces: translucent white, a bright edge, and a soft shadow on iOS (Android elevation would show through the glass). */
export const glass = {
  fill: 'rgba(255,255,255,0.68)',
  strong: 'rgba(255,255,255,0.9)',
  edge: 'rgba(255,255,255,0.95)',
  tint: 'rgba(27,39,71,0.07)',
};
export const glassShadow = Platform.select({
  ios: { shadowColor: '#1B2747', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  default: {},
}) as object;

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const BOOKING_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Pending: { bg: colors.goldSoft, fg: '#8A4F38' },
  Confirmed: { bg: colors.successSoft, fg: colors.success },
  Rejected: { bg: colors.dangerSoft, fg: colors.danger },
  Cancelled: { bg: '#ECECF1', fg: '#5F6475' },
  CheckedIn: { bg: colors.navySoft, fg: colors.navy },
  CheckedOut: { bg: '#E8E4F4', fg: '#4B4488' },
  Completed: { bg: colors.success, fg: colors.white },
  Available: { bg: colors.successSoft, fg: colors.success },
  Reserved: { bg: colors.goldSoft, fg: '#8A4F38' },
  Occupied: { bg: colors.navySoft, fg: colors.navy },
  Maintenance: { bg: colors.dangerSoft, fg: colors.danger },
  Unavailable: { bg: '#ECECF1', fg: '#5F6475' },
  Submitted: { bg: colors.goldSoft, fg: '#8A4F38' },
  Verified: { bg: colors.successSoft, fg: colors.success },
};

export const STATUS_LABEL: Record<string, string> = { CheckedIn: 'Checked In', CheckedOut: 'Checked Out', BankTransfer: 'Bank Transfer' };
