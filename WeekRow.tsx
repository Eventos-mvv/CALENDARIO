import type { CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import type { DayCell } from '../domain/calendar';
import { formatRange } from '../domain/calendar';
import { weekSegments } from '../domain/layout';

interface Props {
  week: DayCell[];
  events: CalendarEvent[];
  today: ISODate;
  variant: 'compact' | 'large';
  onSelect: (id: string) => void;
}

/**
 * Uma semana do calendário. As barras dos eventos ficam numa camada
 * atrás dos números, e cada barra é um botão que abre os detalhes.
 */
export function WeekRow({ week, events, today, variant, onSelect }: Props) {
  const segs = weekSegments(week, events);
  const lanes = segs.reduce((n, s) => Math.max(n, s.lane + 1), 0);
  const busy = new Set<string>();
  for (const c of week) if (c.inMonth && events.some((e) => c.iso >= e.start && c.iso <= e.end)) busy.add(c.iso);

  return (
    <div
      className={`week week--${variant}`}
      style={{ '--lanes': Math.max(lanes, 1) } as CSSProperties}
      role="row"
    >
      <div className="week__bars">
        {segs.map((s) => (
          <button
            key={s.event.id}
            type="button"
            className={`bar${s.startsHere ? ' bar--start' : ''}${s.endsHere ? ' bar--end' : ''}`}
            style={
              {
                '--ev': s.event.color,
                '--col': s.col,
                '--span': s.span,
                '--lane': s.lane,
              } as CSSProperties
            }
            onClick={() => onSelect(s.event.id)}
            aria-label={`${s.event.acronym}: ${s.event.name}, ${formatRange(s.event)}`}
            title={`${s.event.acronym} · ${formatRange(s.event)}`}
          >
            {variant === 'large' && (s.startsHere || s.col === 0) && (
              <span className="bar__label">
                <strong>{s.event.acronym}</strong>
                {s.span >= 3 && s.event.acronym !== s.event.name.toUpperCase() && (
                  <span className="bar__name">{s.event.name}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>
      {week.map((c) => {
        const cls = [
          'day',
          !c.inMonth && 'day--out',
          c.weekday >= 5 && 'day--weekend',
          busy.has(c.iso) && 'day--busy',
          c.iso === today && 'day--today',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div key={c.iso} className={cls} role="gridcell" aria-current={c.iso === today ? 'date' : undefined}>
            <span className="day__num">{c.inMonth ? c.day : ''}</span>
          </div>
        );
      })}
    </div>
  );
}
