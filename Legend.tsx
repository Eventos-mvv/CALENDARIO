import type { CSSProperties } from 'react';
import type { CalendarEvent } from '../domain/types';

interface Props {
  events: CalendarEvent[];
  hidden: string[];
  onToggle: (id: string) => void;
  onShowAll: () => void;
}

/** Legenda de cores que também funciona como filtro por evento. */
export function Legend({ events, hidden, onToggle, onShowAll }: Props) {
  return (
    <div className="legend" role="group" aria-label="Legenda e filtro por evento">
      <span className="legend__hint">Toque num evento para ocultar ou mostrar</span>
      <ul className="legend__list">
        {events.map((ev) => {
          const off = hidden.includes(ev.id);
          return (
            <li key={ev.id}>
              <button
                type="button"
                className={`legend__item${off ? ' is-off' : ''}`}
                style={{ '--ev': ev.color } as CSSProperties}
                aria-pressed={!off}
                onClick={() => onToggle(ev.id)}
                title={ev.name}
              >
                <span className="swatch" aria-hidden="true" />
                {ev.acronym}
              </button>
            </li>
          );
        })}
      </ul>
      {hidden.length > 0 && (
        <button type="button" className="link-btn" onClick={onShowAll}>
          Mostrar todos
        </button>
      )}
    </div>
  );
}
