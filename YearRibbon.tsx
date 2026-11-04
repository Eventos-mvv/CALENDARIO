import type { CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import { MONTH_SHORT, diffDays, durationDays, formatRange, toISO, daysInMonth } from '../domain/calendar';

interface Props {
  year: number;
  events: CalendarEvent[];
  today: ISODate;
  onSelect: (id: string) => void;
  onMonth: (m: number) => void;
}

/**
 * Faixa do ano inteiro em escala real: cada dia ocupa a mesma largura,
 * então a distância entre eventos na tela é a distância real no calendário.
 */
export function YearRibbon({ year, events, today, onSelect, onMonth }: Props) {
  const yearStart = toISO(year, 0, 1);
  const total = diffDays(yearStart, toISO(year, 11, 31)) + 1;
  const pct = (iso: ISODate) => (diffDays(yearStart, iso) / total) * 100;
  const todayIn = today.startsWith(String(year));

  let offset = 0;
  const months = MONTH_SHORT.map((label, m) => {
    const start = offset;
    offset += daysInMonth(year, m);
    return { label, m, left: (start / total) * 100, width: (daysInMonth(year, m) / total) * 100 };
  });

  return (
    <section className="ribbon" aria-label={`Visão geral de ${year} em escala de dias`}>
      <div className="ribbon__track">
        {months.map((mo) => (
          <button
            key={mo.m}
            type="button"
            className="ribbon__month"
            style={{ left: `${mo.left}%`, width: `${mo.width}%` }}
            onClick={() => onMonth(mo.m)}
            aria-label={`Ver mês de ${mo.label}`}
          >
            <span>{mo.label}</span>
          </button>
        ))}
        <div className="ribbon__lane">
          {events.map((ev) => {
            const left = pct(ev.start);
            const width = Math.max((durationDays(ev) / total) * 100, 0.55);
            return (
              <button
                key={ev.id}
                type="button"
                className="ribbon__event"
                style={{ left: `${left}%`, width: `${width}%`, '--ev': ev.color } as CSSProperties}
                onClick={() => onSelect(ev.id)}
                title={`${ev.acronym} · ${formatRange(ev)}`}
                aria-label={`${ev.acronym}, ${formatRange(ev)}`}
              >
                <span className="ribbon__tag">{ev.acronym}</span>
              </button>
            );
          })}
          {todayIn && (
            <span className="ribbon__today" style={{ left: `${pct(today)}%` }}>
              <span>Hoje</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
