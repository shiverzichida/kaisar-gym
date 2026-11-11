const JAKARTA_TZ = 'Asia/Jakarta';

/** Returns 'YYYY-MM-DD' in Asia/Jakarta (WIB, UTC+7). */
export function getJakartaDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Returns compact 'YYYYMMDD' in Asia/Jakarta (for invoice prefixes). */
export function getJakartaCompactDate(date: Date = new Date()): string {
  return getJakartaDateKey(date).replace(/-/g, '');
}

/** Returns 'YYYY-MM' in Asia/Jakarta (for monthly payroll/reports). */
export function getJakartaMonthKey(date: Date = new Date()): string {
  return getJakartaDateKey(date).slice(0, 7);
}

/** Returns integer hour 0..23 in Asia/Jakarta. */
export function getJakartaHour(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TZ,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  return Number(hourStr) % 24;
}

/** Returns Monday 00:00:00 WIB as a UTC Date for the given reference date's week. */
export function getJakartaWeekStartUtc(date: Date = new Date()): Date {
  const [y, m, d] = getJakartaDateKey(date).split('-').map(Number);
  // 00:00 WIB is 17:00 UTC of the previous calendar day
  const midnightWibUtc = new Date(Date.UTC(y, m - 1, d, -7, 0, 0, 0));
  const wibWeekday = new Intl.DateTimeFormat('en-US', {
    timeZone: JAKARTA_TZ,
    weekday: 'short',
  }).format(date);
  const dayOffset: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offsetDays = dayOffset[wibWeekday] ?? 0;
  return new Date(midnightWibUtc.getTime() - offsetDays * 24 * 60 * 60 * 1000);
}
