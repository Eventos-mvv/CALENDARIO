import type { CSSProperties } from 'react';
import type { CalendarEvent } from '../domain/types';
import {
  MONTH_NAMES, WEEKDAYS_INITIAL, durationDays, formatBR, monthMatrix, monthsTouched, pluralDays, weekdayLong,
} from '../domain/calendar';
import { eventTypeLabel } from '../data/eventTypes';
import { SITE } from '../config';

/**
 * Versão para impressão / PDF (A4 paisagem). Fica oculta na tela e é a
 * única coisa visível no @media print. Página 1: os 12 meses; página 2: agenda.
 */
export function PrintSheet({ events }: { events: CalendarEvent[] }) {
  const year = SITE.year;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="print-sheet" aria-hidden="true">
      <section className="print-page">
        <header className="print-head">
          <div>
            <p className="wordmark">{SITE.organization}</p>
            <h1>
              {SITE.title} <span>{year}</span>
            </h1>
            <p className="print-sub">{SITE.subtitle}</p>
          </div>
          <p className="print-dept">{SITE.department}</p>
        </header>

        <div className="print-months">
          {MONTH_NAMES.map((name, m) => (
            <div key={m} className="print-month">
              <h2>{name}</h2>
              <table>
                <thead>
                  <tr>
                    {WEEKDAYS_INITIAL.map((d, i) => (
                      <th key={i}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthMatrix(year, m).map((week) => (
                    <tr key={week[0].iso}>
                      {week.map((c) => {
                        const ev = c.inMonth ? events.find((e) => c.iso >= e.start && c.iso <= e.end) : undefined;
                        const cls = [
                          ev && 'on',
                          ev && c.iso === ev.start && 's',
                          ev && c.iso === ev.end && 'e',
                          c.weekday >= 5 && 'we',
                        ].filter(Boolean).join(' ');
                        return (
                          <td key={c.iso} className={cls || undefined} style={ev ? ({ '--ev': ev.color } as CSSProperties) : undefined}>
                            {c.inMonth ? c.day : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="print-month__evs">
                {events
                  .filter((e) => monthsTouched(e).includes(m))
                  .map((e) => (
                    <span key={e.id} style={{ '--ev': e.color } as CSSProperties}>
                      <i /> {e.acronym} {e.start === e.end ? e.start.slice(8) : `${e.start.slice(8)}–${e.end.slice(8)}`}
                    </span>
                  ))}
              </p>
            </div>
          ))}
        </div>

        <footer className="print-legend">
          {events.map((e) => (
            <span key={e.id} style={{ '--ev': e.color } as CSSProperties}>
              <i /> <strong>{e.acronym}</strong> {e.name}
            </span>
          ))}
        </footer>
      </section>

      <section className="print-page print-page--agenda">
        <header className="print-head print-head--small">
          <div>
            <p className="wordmark">{SITE.organization}</p>
            <h1>
              Agenda de eventos <span>{year}</span>
            </h1>
          </div>
          <p className="print-dept">{SITE.department}</p>
        </header>
        <table className="print-agenda">
          <thead>
            <tr>
              <th>Sigla</th>
              <th>Evento</th>
              <th>Tipo</th>
              <th>Início</th>
              <th>Término</th>
              <th>Duração</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ '--ev': e.color } as CSSProperties}>
                <td>
                  <i /> <strong>{e.acronym}</strong>
                </td>
                <td>
                  {e.name}
                  {e.status === 'a-confirmar' && <em> (informações a confirmar)</em>}
                </td>
                <td>{eventTypeLabel(e.type)}</td>
                <td>
                  {formatBR(e.start)} <small>{cap(weekdayLong(e.start))}</small>
                </td>
                <td>
                  {formatBR(e.end)} <small>{cap(weekdayLong(e.end))}</small>
                </td>
                <td>{pluralDays(durationDays(e))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="print-foot">
          Documento gerado a partir do Calendário Oficial de Eventos {year}. Datas sujeitas a atualização pela {SITE.department}.
        </p>
      </section>
    </div>
  );
}
