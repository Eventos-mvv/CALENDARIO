import type { CalendarEvent, ISODate } from './types';
import { diffDays, monthsTouched, parseISO, sortByStart } from './calendar';

export interface CalendarStats {
  total: number;
  monthsWithEvents: number;
  /** Próximo evento a partir de hoje (ou em andamento). */
  next: { event: CalendarEvent; daysUntil: number; ongoing: boolean } | null;
  /** Mês(es) com mais eventos; empate devolve todos. */
  busiest: { months: number[]; count: number } | null;
  /** Total de dias de evento no ano. */
  eventDays: number;
}

export function computeStats(events: CalendarEvent[], today: ISODate): CalendarStats {
  const sorted = sortByStart(events);
  const perMonth = new Array(12).fill(0) as number[];
  for (const ev of sorted) for (const m of monthsTouched(ev)) perMonth[m]++;

  const max = Math.max(0, ...perMonth);
  const busiest = max > 0
    ? { months: perMonth.flatMap((c, i) => (c === max ? [i] : [])), count: max }
    : null;

  const upcoming = sorted.find((ev) => ev.end >= today) ?? null;
  const next = upcoming
    ? { event: upcoming, daysUntil: Math.max(0, diffDays(today, upcoming.start)), ongoing: upcoming.start <= today }
    : null;

  // Dias distintos com pelo menos um evento (eventos simultâneos contam uma vez).
  const days = new Set<number>();
  for (const ev of sorted) {
    const base = parseISO(ev.start).getTime();
    const n = diffDays(ev.start, ev.end);
    for (let i = 0; i <= n; i++) days.add(base + i * 86_400_000);
  }

  return {
    total: sorted.length,
    monthsWithEvents: perMonth.filter((c) => c > 0).length,
    next,
    busiest,
    eventDays: days.size,
  };
}

export interface Proximity {
  other: CalendarEvent;
  /** Dias livres entre os dois eventos; negativo indica sobreposição. */
  gap: number;
  overlap: boolean;
}

/** Eventos simultâneos ou próximos (até `withinDays` dias livres entre eles). */
export function findProximities(events: CalendarEvent[], ev: CalendarEvent, withinDays = 7): Proximity[] {
  return events
    .filter((o) => o.id !== ev.id)
    .map((other) => {
      const overlap = other.start <= ev.end && other.end >= ev.start;
      const gap = overlap
        ? -1
        : other.start > ev.end
          ? diffDays(ev.end, other.start) - 1
          : diffDays(other.end, ev.start) - 1;
      return { other, gap, overlap };
    })
    .filter((p) => p.overlap || p.gap <= withinDays)
    .sort((a, b) => a.other.start.localeCompare(b.other.start));
}
