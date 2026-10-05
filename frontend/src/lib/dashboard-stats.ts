import type { Inquiry, Property } from "@/lib/types";

export type DayPoint = { label: string; inquiries: number; listings: number; total: number };
export type HourPoint = { label: string; inquiries: number; listings: number; total: number };

export function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function buildActivitySeries(
  inquiries: Inquiry[],
  listings: Property[],
  days = 14
): DayPoint[] {
  const keys = lastNDays(days);
  const map = Object.fromEntries(
    keys.map((k) => [k, { label: k.slice(5), inquiries: 0, listings: 0, total: 0 }])
  ) as Record<string, DayPoint>;

  for (const item of inquiries) {
    const key = item.createdAt.slice(0, 10);
    if (map[key]) {
      map[key].inquiries += 1;
      map[key].total += 1;
    }
  }
  for (const item of listings) {
    const key = item.createdAt.slice(0, 10);
    if (map[key]) {
      map[key].listings += 1;
      map[key].total += 1;
    }
  }
  return keys.map((k) => map[k]);
}

export function buildHourlySeries(
  inquiries: Inquiry[],
  listings: Property[],
  hours = 24
): HourPoint[] {
  const keys: string[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let i = hours - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(now.getHours() - i);
    keys.push(d.toISOString().slice(0, 13)); // YYYY-MM-DDTHH
  }

  const map = Object.fromEntries(
    keys.map((k) => {
      const hour = Number(k.slice(11, 13));
      return [
        k,
        {
          label: `${String(hour).padStart(2, "0")}:00`,
          inquiries: 0,
          listings: 0,
          total: 0,
        },
      ];
    })
  ) as Record<string, HourPoint>;

  for (const item of inquiries) {
    const key = item.createdAt.slice(0, 13);
    if (map[key]) {
      map[key].inquiries += 1;
      map[key].total += 1;
    }
  }
  for (const item of listings) {
    const key = item.createdAt.slice(0, 13);
    if (map[key]) {
      map[key].listings += 1;
      map[key].total += 1;
    }
  }
  return keys.map((k) => map[k]);
}

export function countBy(items: string[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function sumPrices(properties: Property[]) {
  return properties.reduce((sum, p) => sum + Number(p.price || 0), 0);
}

export function averagePrice(properties: Property[]) {
  if (!properties.length) return 0;
  return sumPrices(properties) / properties.length;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function splitRecent(dates: string[], days = 7) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  const prevCutoff = new Date(cutoff);
  prevCutoff.setDate(cutoff.getDate() - days);

  let current = 0;
  let previous = 0;
  for (const iso of dates) {
    const d = new Date(iso);
    if (d >= cutoff) current += 1;
    else if (d >= prevCutoff && d < cutoff) previous += 1;
  }
  return { current, previous, change: percentChange(current, previous) };
}

export function sparklineFromSeries(points: { total: number }[]) {
  return points.map((p) => p.total);
}
