import type { CalendarEvent, EventTypeId } from './types';
import { monthsTouched } from './calendar';

export interface EventFilters {
  query: string;
  /** -1 = todos os meses */
  month: number;
  type: EventTypeId | 'todos';
  /** Eventos ocultados pela legenda. */
  hidden: string[];
}

export const EMPTY_FILTERS: EventFilters = { query: '', month: -1, type: 'todos', hidden: [] };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function matchesQuery(ev: CalendarEvent, query: string): boolean {
  const q = norm(query);
  if (!q) return true;
  // Compara também sem espaços e barras, para "cmsul" encontrar "CM SUL".
  const compact = (s: string) => s.replace(/[^a-z0-9]/g, '');
  const haystack = [norm(ev.name), norm(ev.acronym)];
  return haystack.some((h) => h.includes(q) || (compact(q) !== '' && compact(h).includes(compact(q))));
}

export function applyFilters(events: CalendarEvent[], f: EventFilters): CalendarEvent[] {
  return events.filter(
    (ev) =>
      !f.hidden.includes(ev.id) &&
      (f.type === 'todos' || ev.type === f.type) &&
      (f.month < 0 || monthsTouched(ev).includes(f.month)) &&
      matchesQuery(ev, f.query),
  );
}

export function isFiltering(f: EventFilters): boolean {
  return f.query.trim() !== '' || f.month >= 0 || f.type !== 'todos' || f.hidden.length > 0;
}
