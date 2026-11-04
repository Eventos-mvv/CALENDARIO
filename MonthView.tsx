import { useRef, type CSSProperties } from 'react';
import type { CalendarEvent, ISODate } from '../domain/types';
import { MONTH_NAMES, MONTH_SHORT, WEEKDAYS_SHORT, monthMatrix, monthsTouched } from '../domain/calendar';
import { WeekRow } from './WeekRow';
import { EventCard } from './EventCard';
import { Icon } from './Icon';

interface Props {
  year: number;
  month: number;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  today: ISODate;
  onMonth: (m: number) => void;
  onSelect: (id: string) => void;
}

export function MonthView({ year, month, events, allEvents, today, onMonth, onSelect }: Props) {
  const monthEvents = events.filter((ev) => monthsTouched(ev).includes(month));
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = (delta: number) => onMonth((month + delta + 12) % 12);

  return (
    <div className="month-view">
      <nav className="month-strip" aria-label="Escolher mês">
        {MONTH_SHORT.map((label, m) => {
          const count = events.filter((ev) => monthsTouched(ev).includes(m)).length;
          return (
            <button
              key={m}
              type="button"
              className={`month-chip${m === month ? ' is-active' : ''}`}
              aria-current={m === month ? 'true' : undefined}
              onClick={() => onMonth(m)}
            >
              {label}
              <span className="month-chip__dots" aria-hidden="true">
                {allEvents
                  .filter((ev) => events.includes(ev) && monthsTouched(ev).includes(m))
                  .map((ev) => (
                    <span key={ev.id} className="dot" style={{ '--ev': ev.color } as CSSProperties} />
                  ))}
              </span>
              <span className="sr-only">{count ? `, ${count} evento(s)` : ''}</span>
            </button>
          );
        })}
      </nav>

      <div className="month-view__head">
        <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Mês anterior">
          <Icon name="chevronLeft" />
        </button>
        <h2 className="month-view__title" aria-live="polite">
          {MONTH_NAMES[month]} <span>{year}</span>
        </h2>
        <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Próximo mês">
          <Icon name="chevronRight" />
        </button>
      </div>

      <div
        className="cal cal--large"
        role="grid"
        aria-label={`${MONTH_NAMES[month]} de ${year}`}
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const t = touch.current;
          touch.current = null;
          if (!t) return;
          const dx = e.changedTouches[0].clientX - t.x;
          const dy = e.changedTouches[0].clientY - t.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="weekdays" role="row">
          {WEEKDAYS_SHORT.map((d, i) => (
            <span key={d} role="columnheader" className={i >= 5 ? 'is-weekend' : undefined}>
              {d}
            </span>
          ))}
        </div>
        {monthMatrix(year, month).map((week) => (
          <WeekRow key={week[0].iso} week={week} events={events} today={today} variant="large" onSelect={onSelect} />
        ))}
      </div>

      <section className="month-agenda" aria-label={`Eventos de ${MONTH_NAMES[month]}`}>
        <h3 className="month-agenda__title">Eventos de {MONTH_NAMES[month].toLowerCase()}</h3>
        {monthEvents.length ? (
          <div className="card-list">
            {monthEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} allEvents={allEvents} onOpen={onSelect} />
            ))}
          </div>
        ) : (
          <p className="empty">
            Nenhum evento em {MONTH_NAMES[month].toLowerCase()}.{' '}
            {(() => {
              const nextM = [...Array(12).keys()]
                .map((i) => (month + 1 + i) % 12)
                .find((m) => events.some((ev) => monthsTouched(ev).includes(m)));
              return nextM !== undefined ? (
                <button type="button" className="link-btn" onClick={() => onMonth(nextM)}>
                  Ir para {MONTH_NAMES[nextM].toLowerCase()}
                </button>
              ) : null;
            })()}
          </p>
        )}
      </section>
    </div>
  );
}
