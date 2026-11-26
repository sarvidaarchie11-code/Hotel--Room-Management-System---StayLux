import { format } from 'date-fns';
import { randomBytes } from 'crypto';

export const makeRef = (prefix: string): string =>
  `${prefix}-${format(new Date(), 'yyyyMMdd')}-${randomBytes(2).toString('hex').toUpperCase()}`;

/** Parse "yyyy-MM-dd" into a UTC-midnight Date (dates are calendar days, not instants). */
export const parseDay = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

export const todayString = (): string => format(new Date(), 'yyyy-MM-dd');

export const nightsBetween = (a: Date, b: Date): number => Math.round((b.getTime() - a.getTime()) / 86_400_000);

export const toNum = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Optional pagination: without ?page the full list is returned (keeps older callers working). */
export const paging = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 0);
  const paged = Number(query.page) > 0;
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 15));
  return { paged, page, pageSize, ...(paged ? { skip: (page - 1) * pageSize, take: pageSize } : {}) };
};
