import type { CalendarEvent } from './types';
import type { DayCell } from './calendar';

export interface WeekSegment {
  event: CalendarEvent;
  /** Coluna inicial (0 = segunda) e quantidade de colunas ocupadas. */
  col: number;
  span: number;
  /** Faixa vertical, para empilhar eventos simultâneos. */
  lane: number;
  /** O evento começa / termina dentro desta semana (cantos arredondados). */
  startsHere: boolean;
  endsHere: boolean;
}

/**
 * Divide os eventos em barras por semana. Eventos simultâneos recebem
 * faixas (lanes) diferentes para nunca se sobreporem.
 */
export function weekSegments(week: DayCell[], events: CalendarEvent[], onlyInMonth = true): WeekSegment[] {
  const cells = week.map((c) => (onlyInMonth && !c.inMonth ? null : c.iso));
  const segs: WeekSegment[] = [];
  for (const event of events) {
    let first = -1;
    let last = -1;
    cells.forEach((iso, i) => {
      if (iso && iso >= event.start && iso <= event.end) {
        if (first < 0) first = i;
        last = i;
      }
    });
    if (first < 0) continue;
    segs.push({
      event,
      col: first,
      span: last - first + 1,
      lane: 0,
      startsHere: cells[first] === event.start,
      endsHere: cells[last] === event.end,
    });
  }
  // Distribuição gulosa em faixas.
  const lanes: number[] = []; // última coluna ocupada por faixa
  segs
    .sort((a, b) => a.col - b.col || b.span - a.span)
    .forEach((s) => {
      let lane = lanes.findIndex((end) => end < s.col);
      if (lane < 0) {
        lane = lanes.length;
        lanes.push(-1);
      }
      lanes[lane] = s.col + s.span - 1;
      s.lane = lane;
    });
  return segs;
}
