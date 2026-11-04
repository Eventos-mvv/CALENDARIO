/**
 * Funções puras de calendário. Não dependem de React nem do navegador,
 * por isso são testadas isoladamente (calendar.test.ts).
 *
 * Toda a aritmética usa UTC para que o fuso do usuário nunca desloque um dia.
 */
import type { CalendarEvent, ISODate } from './types';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
/** Semana iniciando na segunda-feira. */
export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const WEEKDAYS_INITIAL = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
export const WEEKDAYS_LONG = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
];

const DAY_MS = 86_400_000;

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(year: number, monthIndex: number, day: number): ISODate {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** 0 = segunda … 6 = domingo. */
export function mondayIndex(iso: ISODate): number {
  return (parseISO(iso).getUTCDay() + 6) % 7;
}

export function weekdayLong(iso: ISODate): string {
  return WEEKDAYS_LONG[parseISO(iso).getUTCDay()];
}

/** Diferença em dias inteiros (b − a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY_MS);
}

/** Quantidade de dias do evento, contando início e término. */
export function durationDays(ev: Pick<CalendarEvent, 'start' | 'end'>): number {
  return diffDays(ev.start, ev.end) + 1;
}

export function isWithin(iso: ISODate, ev: Pick<CalendarEvent, 'start' | 'end'>): boolean {
  return iso >= ev.start && iso <= ev.end;
}

export function monthOf(iso: ISODate): number {
  return Number(iso.slice(5, 7)) - 1;
}

/** Meses (índice 0–11) tocados por um evento, inclusive os que ele atravessa. */
export function monthsTouched(ev: Pick<CalendarEvent, 'start' | 'end'>): number[] {
  const out: number[] = [];
  const startYear = Number(ev.start.slice(0, 4));
  const endYear = Number(ev.end.slice(0, 4));
  for (let y = startYear; y <= endYear; y++) {
    const from = y === startYear ? monthOf(ev.start) : 0;
    const to = y === endYear ? monthOf(ev.end) : 11;
    for (let m = from; m <= to; m++) if (!out.includes(m)) out.push(m);
  }
  return out;
}

export interface DayCell {
  iso: ISODate;
  day: number;
  /** false para dias de preenchimento do mês anterior/seguinte. */
  inMonth: boolean;
  weekday: number; // 0 = seg
}

/** Grade do mês em semanas de segunda a domingo, com dias de preenchimento. */
export function monthMatrix(year: number, monthIndex: number): DayCell[][] {
  const first = toISO(year, monthIndex, 1);
  const lead = mondayIndex(first);
  const total = daysInMonth(year, monthIndex);
  const cells: DayCell[] = [];
  const firstTime = parseISO(first).getTime();
  const count = Math.ceil((lead + total) / 7) * 7;
  for (let i = 0; i < count; i++) {
    const d = new Date(firstTime + (i - lead) * DAY_MS);
    const iso = toISO(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    cells.push({ iso, day: d.getUTCDate(), inMonth: d.getUTCMonth() === monthIndex, weekday: i % 7 });
  }
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function eventsOnDay(events: CalendarEvent[], iso: ISODate): CalendarEvent[] {
  return events.filter((ev) => isWithin(iso, ev));
}

export function sortByStart(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

/** Data de hoje no fuso de Brasília, como ISO. */
export function todayISO(now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return parts; // en-CA já formata como AAAA-MM-DD
}

// ---------- Formatação no padrão brasileiro ----------

export function formatBR(iso: ISODate): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatLong(iso: ISODate): string {
  const d = parseISO(iso);
  return `${d.getUTCDate()} de ${MONTH_NAMES[d.getUTCMonth()].toLowerCase()} de ${d.getUTCFullYear()}`;
}

/** "18 a 21 de março", "28 de abril a 2 de maio" ou "4 de dezembro". */
export function formatRange(ev: Pick<CalendarEvent, 'start' | 'end'>, withYear = false): string {
  const s = parseISO(ev.start);
  const e = parseISO(ev.end);
  const yr = withYear ? ` de ${e.getUTCFullYear()}` : '';
  const sm = MONTH_NAMES[s.getUTCMonth()].toLowerCase();
  const em = MONTH_NAMES[e.getUTCMonth()].toLowerCase();
  if (ev.start === ev.end) return `${s.getUTCDate()} de ${sm}${yr}`;
  if (s.getUTCMonth() === e.getUTCMonth()) return `${s.getUTCDate()} a ${e.getUTCDate()} de ${em}${yr}`;
  return `${s.getUTCDate()} de ${sm} a ${e.getUTCDate()} de ${em}${yr}`;
}

export function pluralDays(n: number): string {
  return n === 1 ? '1 dia' : `${n} dias`;
}
