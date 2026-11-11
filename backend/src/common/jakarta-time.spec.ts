import {
  getJakartaCompactDate,
  getJakartaDateKey,
  getJakartaHour,
  getJakartaMonthKey,
  getJakartaWeekStartUtc,
} from './jakarta-time';

describe('jakarta-time helpers', () => {
  it('formats UTC evening (17:30Z) as next calendar day in Asia/Jakarta (+07:00)', () => {
    const dt = new Date('2026-11-11T17:30:00.000Z'); // 00:30 WIB on 2026-11-12
    expect(getJakartaDateKey(dt)).toBe('2026-11-12');
    expect(getJakartaCompactDate(dt)).toBe('20261112');
    expect(getJakartaMonthKey(dt)).toBe('2026-11');
    expect(getJakartaHour(dt)).toBe(0);
  });

  it('anchors any weekday to Monday 00:00:00 WIB', () => {
    // Friday 2026-11-13 10:00 WIB -> Monday 2026-11-09 00:00:00 WIB = 2026-11-08T17:00:00Z
    const friday = new Date('2026-11-13T03:00:00.000Z');
    const weekStart = getJakartaWeekStartUtc(friday);
    expect(weekStart.toISOString()).toBe('2026-11-08T17:00:00.000Z');

    // Sunday 2026-11-15 23:00 WIB -> same week Monday 2026-11-09 00:00:00 WIB
    const sundayNight = new Date('2026-11-15T16:00:00.000Z');
    expect(getJakartaWeekStartUtc(sundayNight).toISOString()).toBe('2026-11-08T17:00:00.000Z');
  });
});
