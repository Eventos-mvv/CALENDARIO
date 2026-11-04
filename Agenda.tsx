import type { CalendarEvent, EventTypeId } from '../domain/types';
import type { EventFilters } from '../domain/filters';
import { isFiltering } from '../domain/filters';
import { MONTH_NAMES, monthsTouched } from '../domain/calendar';
import { EVENT_TYPES } from '../data/eventTypes';
import { SITE } from '../config';
import { EventCard } from './EventCard';
import { Icon } from './Icon';

interface Props {
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
  filters: EventFilters;
  onFilters: (patch: Partial<EventFilters>) => void;
  onReset: () => void;
  onOpen: (id: string) => void;
}

export function Agenda({ events, allEvents, filters, onFilters, onReset, onOpen }: Props) {
  const monthsWithEvents = new Set(allEvents.flatMap((ev) => monthsTouched(ev)));
  const typesInUse = EVENT_TYPES.filter((t) => allEvents.some((ev) => ev.type === t.id));
  const filtering = isFiltering(filters);

  return (
    <section className="agenda" id="agenda" aria-labelledby="agenda-title">
      <div className="section-head">
        <h2 id="agenda-title" className="section-title">
          Agenda de eventos {SITE.year}
        </h2>
        <p className="section-sub" aria-live="polite">
          {filtering
            ? `${events.length} de ${allEvents.length} eventos correspondem aos filtros`
            : `${allEvents.length} eventos em ordem cronológica`}
        </p>
      </div>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="field field--search">
          <span className="sr-only">Pesquisar por nome ou sigla</span>
          <Icon name="search" />
          <input
            id="filtro-busca"
            type="search"
            placeholder="Pesquisar por nome ou sigla"
            value={filters.query}
            onChange={(e) => onFilters({ query: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span className="field__label">Mês</span>
          <select
            id="filtro-mes"
            value={filters.month}
            onChange={(e) => onFilters({ month: Number(e.target.value) })}
          >
            <option value={-1}>Todos os meses</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i} disabled={!monthsWithEvents.has(i)}>
                {m}
                {monthsWithEvents.has(i) ? '' : ' (sem eventos)'}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Tipo</span>
          <select
            id="filtro-tipo"
            value={filters.type}
            onChange={(e) => onFilters({ type: e.target.value as EventTypeId | 'todos' })}
          >
            <option value="todos">Todos os tipos</option>
            {typesInUse.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {filtering && (
          <button type="button" className="btn btn--ghost filters__reset" onClick={onReset}>
            <Icon name="reset" size={16} /> Limpar filtros
          </button>
        )}
      </form>

      {events.length ? (
        <div className="card-list">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} allEvents={allEvents} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>Nenhum evento encontrado com esses filtros.</p>
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            Limpar filtros
          </button>
        </div>
      )}
    </section>
  );
}
