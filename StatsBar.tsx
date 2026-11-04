import type { CSSProperties } from 'react';
import type { CalendarStats } from '../domain/stats';
import { MONTH_NAMES, formatRange, pluralDays } from '../domain/calendar';
import { Icon } from './Icon';

interface Props {
  stats: CalendarStats;
  onSelect: (id: string) => void;
  onMonth: (m: number) => void;
}

export function StatsBar({ stats, onSelect, onMonth }: Props) {
  const { next, busiest } = stats;
  const nextLabel = next
    ? next.ongoing
      ? 'Em andamento'
      : next.daysUntil === 0
        ? 'Começa hoje'
        : next.daysUntil === 1
          ? 'Começa amanhã'
          : `Em ${next.daysUntil} dias`
    : '';

  return (
    <section className="stats" aria-label="Indicadores do calendário">
      <div className="stat">
        <span className="stat__label"><Icon name="calendar" size={16} /> Eventos cadastrados</span>
        <span className="stat__value">{stats.total}</span>
        <span className="stat__meta">{pluralDays(stats.eventDays)} de programação</span>
      </div>

      <div className="stat">
        <span className="stat__label"><Icon name="layers" size={16} /> Meses com eventos</span>
        <span className="stat__value">
          {stats.monthsWithEvents}<span className="stat__of">/12</span>
        </span>
        <span className="stat__meta">{12 - stats.monthsWithEvents} meses sem eventos</span>
      </div>

      <div className="stat stat--next">
        <span className="stat__label"><Icon name="clock" size={16} /> Próximo evento</span>
        {next ? (
          <>
            <button
              type="button"
              className="stat__event"
              style={{ '--ev': next.event.color } as CSSProperties}
              onClick={() => onSelect(next.event.id)}
            >
              <span className="swatch" aria-hidden="true" />
              {next.event.acronym}
            </button>
            <span className="stat__meta">
              {formatRange(next.event)}, {nextLabel.charAt(0).toLowerCase() + nextLabel.slice(1)}
            </span>
          </>
        ) : (
          <>
            <span className="stat__value stat__value--sm">Nenhum</span>
            <span className="stat__meta">Todos os eventos do ano já aconteceram</span>
          </>
        )}
      </div>

      <div className="stat">
        <span className="stat__label"><Icon name="peak" size={16} /> Maior concentração</span>
        {busiest ? (
          <>
            <span className="stat__value stat__value--sm">
              {busiest.months.map((m, i) => (
                <span key={m}>
                  {i > 0 && <span className="stat__and"> e </span>}
                  <button type="button" className="stat__month" onClick={() => onMonth(m)}>
                    {MONTH_NAMES[m]}
                  </button>
                </span>
              ))}
            </span>
            <span className="stat__meta">
              {busiest.count} eventos {busiest.months.length > 1 ? 'em cada mês' : 'no mês'}
            </span>
          </>
        ) : (
          <span className="stat__value stat__value--sm">—</span>
        )}
      </div>
    </section>
  );
}
