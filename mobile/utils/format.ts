import { format, parseISO } from 'date-fns';

/** ₱1,250 for whole amounts, ₱1,250.50 only when there are centavos. */
export const money = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  return `₱${(Number.isInteger(v) ? v.toFixed(0) : v.toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/** Booking dates are calendar days stored at UTC midnight; show them without timezone drift. */
export const day = (iso: string, pattern = 'MMM d, yyyy'): string => format(parseISO(iso.slice(0, 10)), pattern);
export const stamp = (iso: string): string => format(new Date(iso), 'MMM d, yyyy h:mm a');
export const ymd = (d: Date): string => format(d, 'yyyy-MM-dd');
export const label = (s: string): string => s.replace(/([a-z])([A-Z])/g, '$1 $2');
