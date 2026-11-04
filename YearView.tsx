import type { CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import { MONTH_NAMES, WEEKDAYS_INITIAL, WEEKDAYS_SHORT, monthMatrix, monthsTouched } from '../domain/calendar';
import { WeekRow } from './WeekRow';

interface Props {
  year: number;
  events: CalendarEvent[];
  today: ISODate;
  onSelect: (id: string) => void;
  onOpenMonth: (m: number) => void;
}

export function YearView({ year, events, today, onSelect, onOpenMonth }: Props) {
  return (
    <div className="year-grid">
      {MONTH_NAMES.map((name, m) => {
        const monthEvents = events.filter((ev) => monthsTouched(ev).includes(m));
        return (
          <article key={m} className={`month-card${monthEvents.length ? ' has-events' : ''}`} aria-label={`${name} de ${year}`}>
            <header className="month-card__head">
              <button type="button" className="month-card__title" onClick={() => onOpenMonth(m)} title={`Abrir ${name} ampliado`}>
                {name}
              </button>
              <span className="month-card__dots" aria-label={`${monthEvents.length} evento(s)`}>
                {monthEvents.map((ev) => (
                  <span key={ev.id} className="dot" style={{ '--ev': ev.color } as CSSProperties} title={ev.acronym} />
                ))}
              </span>
            </header>
            <div className="cal cal--compact" role="grid">
              <div className="weekdays" role="row">
                {WEEKDAYS_INITIAL.map((d, i) => (
                  <span key={i} role="columnheader" className={i >= 5 ? 'is-weekend' : undefined} title={WEEKDAYS_SHORT[i]}>
                    <abbr title={WEEKDAYS_SHORT[i]}>{d}</abbr>
                  </span>
                ))}
              </div>
              {monthMatrix(year, m).map((week) => (
                <WeekRow key={week[0].iso} week={week} events={events} today={today} variant="compact" onSelect={onSelect} />
              ))}
            </div>
            {monthEvents.length > 0 && (
              <ul className="month-card__list">
                {monthEvents.map((ev) => (
                  <li key={ev.id}>
                    <button type="button" onClick={() => onSelect(ev.id)} style={{ '--ev': ev.color } as CSSProperties}>
                      <span className="swatch" aria-hidden="true" />
                      <strong>{ev.acronym}</strong>
                      <span className="month-card__range">
                        {ev.start === ev.end
                          ? ev.start.slice(8)
                          : `${ev.start.slice(8)}–${ev.end.slice(8)}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
