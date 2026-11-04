import type { CSSProperties } from 'react';
import type { CalendarEvent } from '../domain/types';
import { MONTH_SHORT, durationDays, formatBR, monthOf, pluralDays, weekdayLong } from '../domain/calendar';
import { findProximities } from '../domain/stats';
import { eventTypeLabel } from '../data/eventTypes';
import { SITE } from '../config';

interface Props {
  event: CalendarEvent;
  allEvents: CalendarEvent[];
  onOpen: (id: string) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function EventCard({ event: ev, allEvents, onOpen }: Props) {
  const days = durationDays(ev);
  const near = findProximities(allEvents, ev, SITE.proximityDays);
  const sameMonth = monthOf(ev.start) === monthOf(ev.end);

  return (
    <article className="event-card" style={{ '--ev': ev.color } as CSSProperties}>
      <div className="date-tile" aria-hidden="true">
        <span className="date-tile__days">
          {ev.start.slice(8)}
          {ev.start !== ev.end && <>–{ev.end.slice(8)}</>}
        </span>
        <span className="date-tile__month">
          {MONTH_SHORT[monthOf(ev.start)]}
          {!sameMonth && `–${MONTH_SHORT[monthOf(ev.end)]}`}
        </span>
      </div>

      <div className="event-card__body">
        <div className="event-card__top">
          <span className="acronym">{ev.acronym}</span>
          <span className="type-tag">{eventTypeLabel(ev.type)}</span>
          {ev.status === 'a-confirmar' && <span className="status-tag">Informações a confirmar</span>}
        </div>
        <h3 className="event-card__name">{ev.name}</h3>
        <dl className="event-card__facts">
          <div>
            <dt>Início</dt>
            <dd>
              {formatBR(ev.start)} <span>{cap(weekdayLong(ev.start)).replace('-feira', '')}</span>
            </dd>
          </div>
          <div>
            <dt>Término</dt>
            <dd>
              {formatBR(ev.end)} <span>{cap(weekdayLong(ev.end)).replace('-feira', '')}</span>
            </dd>
          </div>
          <div>
            <dt>Duração</dt>
            <dd>{pluralDays(days)}</dd>
          </div>
        </dl>
        {near.length > 0 && (
          <p className="proximity">
            {near
              .map((p) =>
                p.overlap
                  ? `Simultâneo a ${p.other.acronym}`
                  : `${p.gap === 0 ? 'Em sequência com' : `${pluralDays(p.gap)} livres até`} ${p.other.acronym}`,
              )
              .join('; ')}
          </p>
        )}
      </div>

      <button type="button" className="btn btn--ghost event-card__cta" onClick={() => onOpen(ev.id)}>
        Ver detalhes
      </button>
    </article>
  );
}
